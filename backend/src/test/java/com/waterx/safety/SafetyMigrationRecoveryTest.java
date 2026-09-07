package com.waterx.safety;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.jdbc.core.simple.JdbcClient;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/** Isolated, stopped-cluster copy rehearsal; never accepts a production connection or directory. */
class SafetyMigrationRecoveryTest {
    @TempDir Path workspace;
    private final ObjectMapper json = new ObjectMapper();

    @Test void populatedV18UpgradeAndBothRecoveryPointsPreserveRecordsAndFiles() throws Exception {
        Path source = workspace.resolve("source"), backup18 = workspace.resolve("backup-v18");
        Path backup19 = workspace.resolve("backup-v19"), restored18 = workspace.resolve("restored-v18");
        Path restored19 = workspace.resolve("restored-v19");
        Path uploads = workspace.resolve("uploads");
        String key = "rehearsal/legacy-evidence.txt";
        byte[] evidence = "WaterX isolated recovery fixture; not business evidence".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        Files.createDirectories(uploads.resolve(key).getParent());
        Files.write(uploads.resolve(key), evidence);
        Map<String, List<String>> before, upgraded;
        List<JsonNode> oldHazards;
        List<String> oldTasks, oldResults, oldAttachments;

        try (var pg = start(source)) {
            Flyway.configure().dataSource(pg.getPostgresDatabase()).target("18").load().migrate();
            var db = JdbcClient.create(pg.getPostgresDatabase());
            // All five legacy states, with and without a responsible person; retain real zero costs.
            for (String state : List.of("OPEN", "OVERDUE", "RECTIFYING", "REVIEW_PENDING", "CLOSED")) {
                for (boolean assigned : List.of(false, true)) {
                    db.sql("""
                        insert into safety_hazard(tenant_id,site_id,hazard_no,source_type,location,name,
                          category_major,description,hazard_level,rectification_measure,due_date,
                          estimated_cost,responsible_employee_id,status,completion_note,review_comment)
                        select tenant_id,site_id,:number,'EMPLOYEE_REPORT','隔离演练','旧记录演练',
                          '设备设施及物料类','保留旧描述','MAJOR','旧措施',date '2026-08-31',0,
                          case when :assigned then responsible_employee_id else null end,:state,'旧完成意见','旧复查意见'
                        from safety_hazard where id='83000000-0000-0000-0000-000000000001'
                        """).param("number", "REHEARSAL-" + state + "-" + assigned)
                            .param("assigned", assigned).param("state", state).update();
                }
            }
            db.sql("""
                insert into inspection_result(tenant_id,site_id,task_id,template_item_id,result,problem_description)
                select tenant_id,site_id,id,'81000000-0000-0000-0000-000000000004','NON_COMPLIANT','原始检查发现'
                from inspection_task where id='82000000-0000-0000-0000-000000000002'
                """).update();
            db.sql("""
                insert into safety_attachment(tenant_id,site_id,object_type,object_id,business_stage,
                  original_name,storage_key,content_type,file_size)
                select tenant_id,site_id,'SAFETY_HAZARD',id,'RECTIFICATION','隔离演练证据.txt',:key,'text/plain',:size
                from safety_hazard where id='83000000-0000-0000-0000-000000000001'
                """).param("key", key).param("size", evidence.length).update();
            before = snapshot(db);
            oldHazards = nodes(before.get("safety_hazard"));
            oldTasks = before.get("inspection_task");
            oldResults = before.get("inspection_result");
            oldAttachments = before.get("safety_attachment");
        }
        // Only copy a cleanly stopped temporary cluster; no live-file backup claims.
        copyTree(source, backup18);
        copyTree(uploads, workspace.resolve("files-v18"));
        try (var pg = start(source)) {
            var flyway = Flyway.configure().dataSource(pg.getPostgresDatabase()).target("19").load();
            assertEquals(1, flyway.migrate().migrationsExecuted);
            flyway.validate();
            assertEquals(0, flyway.migrate().migrationsExecuted, "Repeat startup must not re-import history");
            var db = JdbcClient.create(pg.getPostgresDatabase());
            assertEquals(oldHazards.size(), count(db, "safety_hazard"));
            assertEquals(oldHazards.size(), count(db, "safety_hazard_event"));
            for (var old : oldHazards) {
                var row = json.readTree(db.sql("select to_jsonb(h)::text from safety_hazard h where id=cast(:id as uuid)")
                        .param("id", old.path("id").asText()).query(String.class).single());
                var event = json.readTree(db.sql("select snapshot::text from safety_hazard_event where hazard_id=cast(:id as uuid) and action='LEGACY_CAPTURE'")
                        .param("id", old.path("id").asText()).query(String.class).single());
                old.fields().forEachRemaining(f -> {
                    assertEquals(f.getValue(), event.get(f.getKey()), "Original event field: " + f.getKey());
                    if (!f.getKey().equals("status")) assertEquals(f.getValue(), row.get(f.getKey()), f.getKey());
                });
                String state = old.path("status").asText();
                String expected = Set.of("OPEN", "OVERDUE", "RECTIFYING").contains(state)
                        ? (old.path("responsible_employee_id").isNull() ? "PENDING_ACCEPTANCE" : "RECTIFYING") : state;
                assertEquals(expected, row.path("status").asText());
                assertEquals(old.get("category_major"), row.get("legacy_category_major"));
                assertEquals("UNDETERMINED", row.path("legal_major_status").asText());
                assertTrue(row.path("review_signature").isNull(), "Do not manufacture historic signatures");
            }
            assertOldFieldsPreserved(db, "inspection_task", oldTasks);
            assertOldFieldsPreserved(db, "inspection_result", oldResults);
            assertEquals(oldAttachments, rows(db, "safety_attachment"));
            assertEquals(oldTasks.size(), db.sql("select count(*) from inspection_task where snapshot_origin='LEGACY_CAPTURE' and signature_data is null and completed_by is null")
                    .query(Integer.class).single());
            assertEquals(0, db.sql("""
                select count(*) from inspection_task k join inspection_template_item i on i.template_id=k.template_id and i.tenant_id=k.tenant_id
                left join inspection_task_item s on s.task_id=k.id and s.item_id=i.id and s.tenant_id=k.tenant_id
                where s.item_id is null or s.content<>i.content
                """).query(Integer.class).single());
            assertEquals(9, db.sql("select count(*) from inspection_template where code like 'SOURCE-%'").query(Integer.class).single());
            assertEquals(131, db.sql("select count(*) from inspection_template_item i join inspection_template t on t.id=i.template_id where t.code like 'SOURCE-%'").query(Integer.class).single());
            // A new-version write must survive the V19 recovery point, not the older V18 backup.
            db.sql("update safety_hazard set completion_note='V19新增演练内容' where hazard_no='REHEARSAL-RECTIFYING-true'").update();
            upgraded = snapshot(db);
        }
        copyTree(source, backup19);
        copyTree(uploads, workspace.resolve("files-v19"));
        copyTree(backup18, restored18);
        copyTree(backup19, restored19);
        try (var pg = start(restored18)) {
            assertEquals(before, snapshot(JdbcClient.create(pg.getPostgresDatabase())), "V18 full public-schema recovery");
        }
        try (var pg = start(restored19)) {
            assertEquals(upgraded, snapshot(JdbcClient.create(pg.getPostgresDatabase())), "V19 full public-schema recovery including new writes");
            Flyway.configure().dataSource(pg.getPostgresDatabase()).target("19").load().validate();
        }
        copyTree(workspace.resolve("files-v18"), workspace.resolve("restored-files-v18"));
        copyTree(workspace.resolve("files-v19"), workspace.resolve("restored-files-v19"));
        assertArrayEquals(evidence, Files.readAllBytes(workspace.resolve("restored-files-v18").resolve(key)));
        assertArrayEquals(evidence, Files.readAllBytes(workspace.resolve("restored-files-v19").resolve(key)));
    }

    private EmbeddedPostgres start(Path path) throws Exception {
        if (!path.normalize().startsWith(workspace)) throw new IllegalArgumentException("Only test-owned directories allowed");
        return EmbeddedPostgres.builder().setDataDirectory(path).setCleanDataDirectory(false)
                .setServerConfig("listen_addresses", "127.0.0.1").start();
    }

    private void copyTree(Path source, Path target) throws Exception {
        assertFalse(Files.exists(target), "Never overwrite a backup or restore target");
        try (var paths = Files.walk(source)) {
            for (Path path : paths.toList()) {
                assertFalse(Files.isSymbolicLink(path), "This fixture must not copy external tablespaces or symlinks");
                Path to = target.resolve(source.relativize(path));
                // Directory copies create an empty directory; retain PostgreSQL's required 0700 mode.
                Files.copy(path, to, java.nio.file.StandardCopyOption.COPY_ATTRIBUTES);
            }
        }
    }

    private Map<String, List<String>> snapshot(JdbcClient db) {
        var result = new TreeMap<String, List<String>>();
        for (String table : db.sql("select tablename from pg_tables where schemaname='public' order by tablename").query(String.class).list())
            result.put(table, rows(db, table));
        return result;
    }

    private List<String> rows(JdbcClient db, String table) {
        if (!table.matches("[a-z_]+")) throw new IllegalArgumentException("Unexpected fixture table");
        return db.sql("select to_jsonb(t)::text from \"" + table + "\" t order by to_jsonb(t)::text").query(String.class).list();
    }

    private int count(JdbcClient db, String table) { return rows(db, table).size(); }
    private List<JsonNode> nodes(List<String> values) throws Exception {
        var result = new ArrayList<JsonNode>();
        for (String value : values) result.add(json.readTree(value));
        return result;
    }

    private void assertOldFieldsPreserved(JdbcClient db, String table, List<String> oldRows) throws Exception {
        var current = new HashMap<String, JsonNode>();
        for (var row : nodes(rows(db, table))) current.put(row.path("id").asText(), row);
        assertEquals(oldRows.size(), current.size());
        for (var old : nodes(oldRows)) old.fields().forEachRemaining(field ->
                assertEquals(field.getValue(), current.get(old.path("id").asText()).get(field.getKey()), table + "." + field.getKey()));
    }
}

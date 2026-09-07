package com.waterx.safety;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.springframework.boot.SpringApplication;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.SecureRandom;
import java.util.*;

/** Isolated local workflow verification. Never packaged in production and never reuses the running database. */
public final class SafetyWorkflowPreviewLauncher {
    public static void main(String[] args)throws Exception {
        var postgres=EmbeddedPostgres.builder().start();
        byte[] random=new byte[16];new SecureRandom().nextBytes(random);String password="Preview-"+HexFormat.of().formatHex(random)+"!";
        System.setProperty("spring.datasource.url",postgres.getJdbcUrl("postgres","postgres"));
        System.setProperty("spring.datasource.username","postgres");System.setProperty("spring.datasource.password","");
        System.setProperty("app.bootstrap.admin-username","safety_preview_admin");System.setProperty("app.bootstrap.admin-password",password);
        System.setProperty("server.port","8082");System.setProperty("server.address","127.0.0.1");
        System.setProperty("app.storage.local-dir","/private/tmp/waterx-safety-impl/preview-attachments");
        var app=SpringApplication.run(SafetyApplication.class,args);var jdbc=app.getBean(JdbcClient.class);var encoder=app.getBean(PasswordEncoder.class);
        String tenant="10000000-0000-0000-0000-000000000001",site="30000000-0000-0000-0000-000000000001";
        Map<String,Object> credentials=new LinkedHashMap<>();
        for(String[] actor:List.of(new String[]{"safety_officer","41000000-0000-0000-0000-000000000002","SAFETY_MANAGER"},new String[]{"safety_owner","41000000-0000-0000-0000-000000000005","EMPLOYEE"},new String[]{"safety_reviewer","41000000-0000-0000-0000-000000000003","SAFETY_MANAGER"})){
            UUID id=UUID.randomUUID();jdbc.sql("insert into user_account(id,tenant_id,employee_id,username,password_hash,status,must_change_password) values(:id,cast(:tenant as uuid),cast(:employee as uuid),:name,:hash,'ACTIVE',false)").param("id",id).param("tenant",tenant).param("employee",actor[1]).param("name",actor[0]).param("hash",encoder.encode(password)).update();
            jdbc.sql("insert into user_role_scope(id,tenant_id,user_id,role_id,scope_type,scope_id) select gen_random_uuid(),r.tenant_id,:user,r.id,'SITE',cast(:site as uuid) from role r where r.tenant_id=cast(:tenant as uuid) and r.code=:role").param("user",id).param("site",site).param("tenant",tenant).param("role",actor[2]).update();credentials.put(actor[0],password);
        }
        Path file=Path.of("/private/tmp/waterx-safety-impl/preview-access.json");Files.writeString(file,new ObjectMapper().writeValueAsString(credentials),StandardOpenOption.CREATE,StandardOpenOption.TRUNCATE_EXISTING);Files.setPosixFilePermissions(file,PosixFilePermissions.fromString("rw-------"));
        Runtime.getRuntime().addShutdownHook(new Thread(()->{app.close();try{postgres.close();Files.deleteIfExists(file);}catch(Exception ignored){}}));
        System.out.println("SAFETY_WORKFLOW_PREVIEW_READY http://127.0.0.1:8082");Thread.currentThread().join();
    }
}

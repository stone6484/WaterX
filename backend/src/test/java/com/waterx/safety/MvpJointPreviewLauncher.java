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

/** Isolated joint rehearsal only. Never accepts a production database or modifies existing previews. */
public final class MvpJointPreviewLauncher {
    public static void main(String[] args)throws Exception{
        var pg=EmbeddedPostgres.builder().start();
        byte[] random=new byte[18];new SecureRandom().nextBytes(random);String password="Pilot-"+HexFormat.of().formatHex(random)+"!";
        System.setProperty("spring.datasource.url",pg.getJdbcUrl("postgres","postgres"));
        System.setProperty("spring.datasource.username","postgres");System.setProperty("spring.datasource.password","");
        System.setProperty("server.address","127.0.0.1");System.setProperty("server.port","8085");
        System.setProperty("app.bootstrap.admin-username","joint_technical");System.setProperty("app.bootstrap.admin-password",password);
        Path folder=Path.of("/private/tmp/waterx-mvp-joint");Files.createDirectories(folder);
        Files.setPosixFilePermissions(folder,PosixFilePermissions.fromString("rwx------"));
        System.setProperty("app.storage.local-dir",folder.resolve("attachments").toString());
        var app=SpringApplication.run(SafetyApplication.class,args);var db=app.getBean(JdbcClient.class);
        DailyDataTestFixture.seed(db,app.getBean(PasswordEncoder.class),password);
        // Explicit additional safety responsibilities for these virtual people only.
        for(String key:List.of("operator_a","operator_b"))DailyDataTestFixture.grant(db,DailyDataTestFixture.id(key),"EMPLOYEE",DailyDataTestFixture.SITE,DailyDataTestFixture.LINE);
        DailyDataTestFixture.grant(db,DailyDataTestFixture.id("safety_a"),"SAFETY_MANAGER",DailyDataTestFixture.SITE,DailyDataTestFixture.LINE);
        DailyDataTestFixture.grant(db,DailyDataTestFixture.id("manager_b"),"SAFETY_MANAGER",DailyDataTestFixture.SITE,DailyDataTestFixture.LINE);
        DailyDataTestFixture.grant(db,DailyDataTestFixture.id("plant_manager"),"PLANT_MANAGER",DailyDataTestFixture.SITE,DailyDataTestFixture.LINE);
        for(String[] actor:DailyDataTestFixture.ACTORS)db.sql("""
            insert into employee_position(id,tenant_id,employee_id,org_unit_id,position_id,is_primary,start_date)
            select gen_random_uuid(),tenant_id,:employee,org_unit_id,position_id,true,current_date
            from employee_position where employee_id='41000000-0000-0000-0000-000000000005' limit 1
            """).param("employee",DailyDataTestFixture.id(actor[0]+"-employee")).update();
        var credentials=new LinkedHashMap<String,Object>();
        for(String[] actor:DailyDataTestFixture.ACTORS)credentials.put(actor[1],Map.of("username","pd_"+actor[0],"password",password));
        Path file=folder.resolve("preview-access.json");
        Files.createFile(file,PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
        Files.writeString(file,new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(credentials));
        Runtime.getRuntime().addShutdownHook(new Thread(()->{app.close();try{pg.close();Files.deleteIfExists(file);}catch(Exception ignored){}}));
        System.out.println("MVP_JOINT_PREVIEW_READY http://127.0.0.1:8085");Thread.currentThread().join();
    }
}

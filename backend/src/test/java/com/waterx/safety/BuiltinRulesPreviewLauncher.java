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

/** Local-only persistent preview. Never reads DATABASE_URL or connects to production. */
public final class BuiltinRulesPreviewLauncher {
    public static void main(String[] args)throws Exception{
        Path folder=Path.of(System.getProperty("waterx.local.preview.dir","../data/builtin-rules-preview")).toAbsolutePath().normalize();
        Files.createDirectories(folder);Files.setPosixFilePermissions(folder,PosixFilePermissions.fromString("rwx------"));
        ObjectMapper json=new ObjectMapper();Path access=folder.resolve("access.json");String password;
        if(Files.exists(access))password=json.readTree(Files.readString(access)).path("password").asText();
        else {byte[] random=new byte[18];new SecureRandom().nextBytes(random);password="Local-"+HexFormat.of().formatHex(random)+"!";Files.createFile(access,PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));Files.writeString(access,json.writeValueAsString(Map.of("username","pd_manager_a","password",password,"url","http://127.0.0.1:5190/")));}
        if(password.isBlank())throw new IllegalStateException("Local preview credential missing");
        var pg=EmbeddedPostgres.builder().setDataDirectory(folder.resolve("postgres")).setCleanDataDirectory(false).setServerConfig("listen_addresses","127.0.0.1").start();
        System.setProperty("spring.datasource.url",pg.getJdbcUrl("postgres","postgres"));System.setProperty("spring.datasource.username","postgres");System.setProperty("spring.datasource.password","");
        System.setProperty("server.address","127.0.0.1");System.setProperty("server.port","8090");
        System.setProperty("app.bootstrap.admin-username","local_preview_technical");System.setProperty("app.bootstrap.admin-password",password);
        System.setProperty("app.storage.local-dir",folder.resolve("attachments").toString());
        // Only this local launcher validates the retired experiment migration already applied to old preview data. Not in the production artifact.
        System.setProperty("spring.flyway.locations","classpath:db/migration,classpath:local-preview-legacy");
        var app=SpringApplication.run(SafetyApplication.class,args);var db=app.getBean(JdbcClient.class);
        if(db.sql("select count(*) from user_account where username='pd_manager_a'").query(Integer.class).single()==0)DailyDataTestFixture.seed(db,app.getBean(PasswordEncoder.class),password);
        Runtime.getRuntime().addShutdownHook(new Thread(()->{app.close();try{pg.close();}catch(Exception ignored){}}));
        System.out.println("LOCAL_PREVIEW_READY http://127.0.0.1:8090 (local persistent database; credentials in private access.json)");
        Thread.currentThread().join();
    }
}

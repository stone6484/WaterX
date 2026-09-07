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

/** Local-only test launcher: a new database every launch; no production accounts or automatic grants. */
public final class ProcessArchivePreviewLauncher {
    public static void main(String[] args)throws Exception{
        var pg=EmbeddedPostgres.builder().start();byte[] random=new byte[18];new SecureRandom().nextBytes(random);String password="Pilot-"+HexFormat.of().formatHex(random)+"!";
        System.setProperty("spring.datasource.url",pg.getJdbcUrl("postgres","postgres"));System.setProperty("spring.datasource.username","postgres");System.setProperty("spring.datasource.password","");
        System.setProperty("server.address","127.0.0.1");System.setProperty("server.port","8084");
        System.setProperty("app.bootstrap.admin-username","pd_preview_admin");System.setProperty("app.bootstrap.admin-password",password);
        System.setProperty("app.storage.local-dir","/private/tmp/waterx-collaboration-b2/attachments");
        var app=SpringApplication.run(SafetyApplication.class,args);
        DailyDataTestFixture.seed(app.getBean(JdbcClient.class),app.getBean(PasswordEncoder.class),password);
        var credentials=new LinkedHashMap<String,Object>();for(String[] actor:DailyDataTestFixture.ACTORS)credentials.put(actor[1],Map.of("username","pd_"+actor[0],"password",password));
        Path file=Path.of("/private/tmp/waterx-collaboration-b2/preview-access.json");Files.createDirectories(file.getParent());
        Files.writeString(file,new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(credentials),StandardOpenOption.CREATE,StandardOpenOption.TRUNCATE_EXISTING);Files.setPosixFilePermissions(file,PosixFilePermissions.fromString("rw-------"));
        Runtime.getRuntime().addShutdownHook(new Thread(()->{app.close();try{pg.close();Files.deleteIfExists(file);}catch(Exception ignored){}}));
        System.out.println("PROCESS_ARCHIVE_PREVIEW_READY http://127.0.0.1:8084");Thread.currentThread().join();
    }
}

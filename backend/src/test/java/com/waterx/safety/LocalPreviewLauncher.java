package com.waterx.safety;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;

import java.security.SecureRandom;
import java.util.HexFormat;

/** Local-only preview entry point. It is not packaged into the production application. */
public final class LocalPreviewLauncher {
    private LocalPreviewLauncher() {}

    public static void main(String[] args) throws Exception {
        EmbeddedPostgres postgres = EmbeddedPostgres.builder().setPort(0).start();
        String password = "Preview-" + HexFormat.of().formatHex(randomBytes(8)) + "!";

        System.setProperty("spring.datasource.url", postgres.getJdbcUrl("postgres", "postgres"));
        System.setProperty("spring.datasource.username", "postgres");
        System.setProperty("spring.datasource.password", "");
        System.setProperty("app.bootstrap.admin-username", "preview_admin");
        System.setProperty("app.bootstrap.admin-password", password);
        System.setProperty("server.port", "8080");

        ConfigurableApplicationContext application = SpringApplication.run(SafetyApplication.class, args);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            application.close();
            try { postgres.close(); } catch (Exception ignored) {}
        }));

        System.out.println("PREVIEW_READY");
        System.out.println("PREVIEW_USERNAME=preview_admin");
        System.out.println("PREVIEW_PASSWORD=" + password);
        System.out.println("PREVIEW_API=http://127.0.0.1:8080");
        Thread.currentThread().join();
    }

    private static byte[] randomBytes(int length) {
        byte[] bytes = new byte[length];
        new SecureRandom().nextBytes(bytes);
        return bytes;
    }
}

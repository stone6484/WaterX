package com.waterx.safety.site;

import com.waterx.safety.auth.CurrentUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

@RestController
public class ProjectTwinController {
    private static final String REV27 = "9ca21f2e8d4bbed4c6989212ac1f4aa69372c18a8acb1bbacc87eff4e9990128";
    private final SiteAccessService sites;
    private final Path root;

    public ProjectTwinController(SiteAccessService sites, @Value("${app.storage.local-dir}") String storageDir) {
        this.sites = sites;
        this.root = Path.of(storageDir, "site-twins");
    }

    public record Scene(String html) {}

    @GetMapping("/api/v1/platform/sites/twin-scene")
    public ResponseEntity<Scene> scene(@AuthenticationPrincipal CurrentUser user,
                                       @RequestHeader("X-Site-Id") UUID siteId) throws IOException, NoSuchAlgorithmException {
        sites.requireSiteAccess(user, siteId);
        Path directory = root.resolve(siteId.toString());
        if (Files.notExists(directory)) {
            return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
        }
        if (!sites.mayReadProjectTwin(user, siteId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).cacheControl(CacheControl.noStore()).build();
        }
        byte[] bytes;
        try {
            bytes = Files.readAllBytes(directory.resolve("qingshanhu-rev27.html"));
        } catch (NoSuchFileException missing) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).cacheControl(CacheControl.noStore()).build();
        }
        String digest = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        if (!REV27.equals(digest)) {
            return ResponseEntity.internalServerError().cacheControl(CacheControl.noStore()).build();
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new Scene(new String(bytes, StandardCharsets.UTF_8)));
    }
}

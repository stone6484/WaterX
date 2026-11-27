package com.waterx.safety.site;

import com.waterx.safety.auth.CurrentUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class ProjectTwinControllerTest {
    @Test
    void onlyBoundSitesWithAnExplicitGrantMayLoadAPinnedFile(@TempDir Path storage) throws Exception {
        UUID site = UUID.randomUUID();
        CurrentUser reader = new CurrentUser(UUID.randomUUID(), UUID.randomUUID(), "test", "test", false, Set.of());
        SiteAccessService access = mock(SiteAccessService.class);
        ProjectTwinController controller = new ProjectTwinController(access, storage.toString());
        assertEquals(204, controller.scene(reader, site).getStatusCode().value());
        verify(access).requireSiteAccess(reader, site);
        Path location = Files.createDirectories(storage.resolve("site-twins").resolve(site.toString()));
        assertEquals(403, controller.scene(reader, site).getStatusCode().value());
        when(access.mayReadProjectTwin(reader, site)).thenReturn(true);
        assertEquals(503, controller.scene(reader, site).getStatusCode().value());
        Files.writeString(location.resolve("qingshanhu-rev27.html"), "unverified test file");
        assertEquals(500, controller.scene(reader, site).getStatusCode().value());
    }

    @Test
    void exhibitIsBoundToAccountTenantAndSiteAndCannotServeAnUnverifiedFile(@TempDir Path storage) throws Exception {
        SiteAccessService access = mock(SiteAccessService.class);
        var controller = new ProjectTwinController(access, storage.toString());
        UUID site = UUID.randomUUID(), tenant = UUID.randomUUID();
        var reader = new CurrentUser(UUID.randomUUID(), tenant, "reader", "Viewer", false, Set.of());
        String key = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest("reader".getBytes(StandardCharsets.UTF_8)));
        Path dir = Files.createDirectories(storage.resolve("site-twins/showcase").resolve(tenant.toString()).resolve(site.toString()));
        Files.writeString(dir.resolve(key + ".html"), "wrong scene");
        assertEquals(500, controller.scene(reader, site).getStatusCode().value());
        assertEquals(204, controller.scene(reader, UUID.randomUUID()).getStatusCode().value());
        var other = new CurrentUser(UUID.randomUUID(), tenant, "other", "Other", false, Set.of());
        assertEquals(204, controller.scene(other, site).getStatusCode().value());
        var elsewhere = new CurrentUser(UUID.randomUUID(), UUID.randomUUID(), "reader", "Viewer", false, Set.of());
        assertEquals(204, controller.scene(elsewhere, site).getStatusCode().value());
        verify(access).requireSiteAccess(reader, site);
    }
}

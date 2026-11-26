package com.waterx.safety.site;

import com.waterx.safety.auth.CurrentUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
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
}

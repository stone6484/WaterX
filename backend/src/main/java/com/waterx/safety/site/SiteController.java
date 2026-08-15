package com.waterx.safety.site;

import com.waterx.safety.auth.CurrentUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/platform/sites")
public class SiteController {
    private final SiteAccessService sites;

    public SiteController(SiteAccessService sites) { this.sites = sites; }

    @GetMapping
    List<SiteAccessService.SiteView> list(@AuthenticationPrincipal CurrentUser user) {
        return sites.accessibleSites(user);
    }
}

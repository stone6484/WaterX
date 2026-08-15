package com.waterx.safety.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class VersionController {
    @GetMapping("/api/shortcuts/version-check")
    public Map<String, Object> versionCheck() {
        return Map.of(
                "service", "waterx-safety-api",
                "version", "0.1.0",
                "status", "ok"
        );
    }
}

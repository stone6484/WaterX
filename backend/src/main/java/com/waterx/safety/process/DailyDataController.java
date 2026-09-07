package com.waterx.safety.process;

import com.fasterxml.jackson.databind.JsonNode;
import com.waterx.safety.auth.CurrentUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/process/daily")
public class DailyDataController {
    private final DailyDataService flow;
    public DailyDataController(DailyDataService flow){this.flow=flow;}
    @GetMapping("/context") List<JsonNode> context(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site){return flow.context(u,site);}
    @GetMapping List<JsonNode> list(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@RequestParam UUID line){return flow.list(u,site,line);}
    @PostMapping Map<String,UUID> create(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@RequestBody DailyDataService.Assignment input){return Map.of("id",flow.create(u,site,input));}
    @GetMapping("/{id}") JsonNode detail(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id){return flow.detail(u,site,id);}
    @PostMapping("/{id}/{action}") JsonNode act(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id,@PathVariable String action,@RequestBody DailyDataService.Action input){return flow.act(u,site,id,action,input);}
    @GetMapping("/{id}/analysis-source") JsonNode source(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id){return flow.analysisSource(u,site,id);}
    @GetMapping("/{id}/export") JsonNode export(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id){return flow.export(u,site,id);}
}

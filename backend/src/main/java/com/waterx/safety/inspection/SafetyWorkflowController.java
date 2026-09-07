package com.waterx.safety.inspection;

import com.waterx.safety.auth.CurrentUser;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/safety/workflow")
@PreAuthorize("hasAnyAuthority('inspection:read','hazard:read')")
public class SafetyWorkflowController {
    private final SafetyWorkflowService flow;
    public SafetyWorkflowController(SafetyWorkflowService flow){this.flow=flow;}
    @GetMapping("/context")
    Map<String,Object> context(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site){return flow.context(u,site);}
    @GetMapping("/directory")
    Map<String,Object> directory(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site){return flow.directory(u,site);}
    @GetMapping("/hazards/{id}")
    Map<String,Object> detail(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id){return flow.detail(u,site,id);}
    @PostMapping("/hazards/{id}/assignment")
    void assign(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id,@RequestBody SafetyWorkflowService.Assignment input){flow.assign(u,site,id,input);}
    @PostMapping("/hazards/{id}/receipt")
    void receive(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id,@RequestBody SafetyWorkflowService.Action input){flow.receive(u,site,id,input);}
    @PostMapping("/hazards/{id}/rectification")
    void rectify(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id,@RequestBody SafetyWorkflowService.Action input){flow.rectify(u,site,id,input);}
    @PostMapping("/hazards/{id}/review")
    void review(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id,@RequestBody SafetyWorkflowService.Action input){flow.review(u,site,id,input);}
    @PostMapping("/tasks/{id}/complete")
    Map<String,Integer> complete(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id,@RequestBody SafetyWorkflowService.Completion input){return Map.of("hazardsCreated",flow.complete(u,site,id,input));}
    @PutMapping("/templates/{id}")
    Map<String,Object> revise(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id,@RequestBody SafetyWorkflowService.TemplateRevision input){return flow.reviseTemplate(u,site,id,input);}
}

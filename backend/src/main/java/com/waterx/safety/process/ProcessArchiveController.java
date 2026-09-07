package com.waterx.safety.process;
import com.fasterxml.jackson.databind.JsonNode;
import com.waterx.safety.auth.CurrentUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/api/v1/process/archive")
public class ProcessArchiveController {
 private final ProcessArchiveService flow;public ProcessArchiveController(ProcessArchiveService flow){this.flow=flow;}
 @GetMapping("/parameters") JsonNode parameters(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@RequestParam UUID line){return flow.parameters(u,site,line);}
 @PostMapping("/parameters/{line}/{kind}/{action}") JsonNode parameter(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID line,@PathVariable String kind,@PathVariable String action,@RequestBody ProcessArchiveService.ParameterInput input){if(!action.equals("draft")&&!action.equals("publish"))throw new com.waterx.safety.common.BusinessException("INVALID_ACTION","操作不正确",org.springframework.http.HttpStatus.BAD_REQUEST);return flow.saveParameter(u,site,line,kind,input,action.equals("publish"));}
 @GetMapping("/reports") JsonNode reports(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@RequestParam UUID record){return flow.reports(u,site,record);}
 @PostMapping("/reports") JsonNode generate(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@RequestBody ProcessArchiveService.ReportInput input){return flow.generate(u,site,input);}
 @GetMapping("/reports/{id}") JsonNode report(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id){return flow.report(u,site,id);}
 @PostMapping("/reports/{id}/save") JsonNode save(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id,@RequestBody ProcessArchiveService.SaveReport input){return flow.saveReport(u,site,id,input);}
 @GetMapping("/reports/{id}/export") JsonNode export(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id){return flow.exportReport(u,site,id);}
}

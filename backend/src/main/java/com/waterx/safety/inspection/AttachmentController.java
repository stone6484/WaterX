package com.waterx.safety.inspection;

import com.waterx.safety.auth.CurrentUser;
import com.waterx.safety.common.BusinessException;
import com.waterx.safety.site.SiteAccessService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/safety/hazards/{hazardId}/attachments")
public class AttachmentController {
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg","image/png","image/webp","application/pdf",
            "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    private final JdbcClient jdbc;
    private final SiteAccessService sites;
    private final Path storageRoot;

    public AttachmentController(JdbcClient jdbc, SiteAccessService sites,
                                @Value("${app.storage.local-dir}") String storageDir) {
        this.jdbc=jdbc; this.sites=sites; this.storageRoot=Path.of(storageDir).toAbsolutePath().normalize();
    }

    @GetMapping
    @PreAuthorize("hasAuthority('hazard:read')")
    List<AttachmentView> list(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                              @PathVariable UUID hazardId) {
        sites.requireSiteAccess(user,siteId); requireHazard(user,siteId,hazardId);
        return jdbc.sql("""
            select a.id,a.business_stage,a.original_name,a.content_type,a.file_size,a.uploaded_at,
                   coalesce(e.display_name,u.username) uploaded_by_name
            from safety_attachment a left join user_account u on u.tenant_id=a.tenant_id and u.id=a.uploaded_by
            left join employee e on e.tenant_id=u.tenant_id and e.id=u.employee_id
            where a.tenant_id=:tenantId and a.site_id=:siteId and a.object_type='SAFETY_HAZARD' and a.object_id=:hazardId
            order by a.uploaded_at,a.id
            """).param("tenantId",user.tenantId()).param("siteId",siteId).param("hazardId",hazardId)
                .query((rs,n)->new AttachmentView(rs.getObject("id",UUID.class),rs.getString("business_stage"),
                        rs.getString("original_name"),rs.getString("content_type"),rs.getLong("file_size"),
                        rs.getObject("uploaded_at",OffsetDateTime.class),rs.getString("uploaded_by_name"))).list();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('hazard:manage')")
    AttachmentView upload(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                          @PathVariable UUID hazardId,@RequestParam String stage,@RequestPart("file") MultipartFile file) {
        sites.requireSiteAccess(user,siteId); requireHazard(user,siteId,hazardId);
        if(!Set.of("DISCOVERY","RECTIFICATION","REVIEW").contains(stage))
            throw new BusinessException("ATTACHMENT_STAGE_INVALID","附件业务阶段无效",HttpStatus.BAD_REQUEST);
        if(file.isEmpty() || file.getSize()>MAX_FILE_SIZE)
            throw new BusinessException("ATTACHMENT_SIZE_INVALID","文件不能为空且单个文件不能超过 10MB",HttpStatus.BAD_REQUEST);
        String contentType=file.getContentType()==null?"application/octet-stream":file.getContentType().toLowerCase(Locale.ROOT);
        if(!ALLOWED_TYPES.contains(contentType))
            throw new BusinessException("ATTACHMENT_TYPE_INVALID","仅支持图片、PDF、Word 和 Excel 文件",HttpStatus.BAD_REQUEST);
        String original=safeOriginalName(file.getOriginalFilename());
        String extension=extension(original);
        String key=user.tenantId()+"/"+siteId+"/hazards/"+hazardId+"/"+UUID.randomUUID()+extension;
        Path target=storageRoot.resolve(key).normalize();
        if(!target.startsWith(storageRoot)) throw new BusinessException("ATTACHMENT_PATH_INVALID","附件存储路径无效",HttpStatus.BAD_REQUEST);
        UUID id=UUID.randomUUID();
        try {
            Files.createDirectories(target.getParent());
            try(var input=file.getInputStream()){Files.copy(input,target, StandardCopyOption.REPLACE_EXISTING);}
            jdbc.sql("""
                insert into safety_attachment(id,tenant_id,site_id,object_type,object_id,business_stage,original_name,storage_key,content_type,file_size,uploaded_by)
                values(:id,:tenantId,:siteId,'SAFETY_HAZARD',:hazardId,:stage,:name,:key,:contentType,:size,:userId)
                """).param("id",id).param("tenantId",user.tenantId()).param("siteId",siteId).param("hazardId",hazardId)
                    .param("stage",stage).param("name",original).param("key",key).param("contentType",contentType)
                    .param("size",file.getSize()).param("userId",user.userId()).update();
        } catch(IOException exception) {
            throw new BusinessException("ATTACHMENT_SAVE_FAILED","附件保存失败",HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return new AttachmentView(id,stage,original,contentType,file.getSize(),OffsetDateTime.now(),user.displayName());
    }

    @GetMapping("/{attachmentId}/download")
    @PreAuthorize("hasAuthority('hazard:read')")
    ResponseEntity<Resource> download(@AuthenticationPrincipal CurrentUser user,@RequestHeader("X-Site-Id") UUID siteId,
                                      @PathVariable UUID hazardId,@PathVariable UUID attachmentId) {
        sites.requireSiteAccess(user,siteId); requireHazard(user,siteId,hazardId);
        StoredFile stored=jdbc.sql("""
            select original_name,storage_key,content_type from safety_attachment
            where tenant_id=:tenantId and site_id=:siteId and object_id=:hazardId and id=:id
            """).param("tenantId",user.tenantId()).param("siteId",siteId).param("hazardId",hazardId).param("id",attachmentId)
                .query((rs,n)->new StoredFile(rs.getString(1),rs.getString(2),rs.getString(3))).optional()
                .orElseThrow(()->new BusinessException("ATTACHMENT_NOT_FOUND","附件不存在",HttpStatus.NOT_FOUND));
        Path path=storageRoot.resolve(stored.storageKey()).normalize();
        if(!path.startsWith(storageRoot) || !Files.isRegularFile(path))
            throw new BusinessException("ATTACHMENT_NOT_FOUND","附件文件不存在",HttpStatus.NOT_FOUND);
        HttpHeaders headers=new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename(stored.originalName(), StandardCharsets.UTF_8).build());
        headers.setContentType(MediaType.parseMediaType(stored.contentType()));
        try { headers.setContentLength(Files.size(path)); } catch(IOException ignored) {}
        return new ResponseEntity<>(new FileSystemResource(path),headers,HttpStatus.OK);
    }

    private void requireHazard(CurrentUser user,UUID siteId,UUID hazardId) {
        int count=jdbc.sql("select count(*) from safety_hazard where tenant_id=:tenantId and site_id=:siteId and id=:id")
                .param("tenantId",user.tenantId()).param("siteId",siteId).param("id",hazardId).query(Integer.class).single();
        if(count==0) throw new BusinessException("HAZARD_NOT_FOUND","隐患不存在或不属于当前厂区",HttpStatus.NOT_FOUND);
    }
    private String safeOriginalName(String name) {
        String safe=name==null?"attachment":Path.of(name).getFileName().toString().replaceAll("[\\r\\n]","_");
        return safe.length()>240?safe.substring(safe.length()-240):safe;
    }
    private String extension(String name) { int dot=name.lastIndexOf('.'); return dot>=0&&name.length()-dot<=10?name.substring(dot).toLowerCase(Locale.ROOT):""; }
    public record AttachmentView(UUID id,String stage,String originalName,String contentType,long fileSize,OffsetDateTime uploadedAt,String uploadedByName) {}
    private record StoredFile(String originalName,String storageKey,String contentType) {}
}

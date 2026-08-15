package com.waterx.safety.asset;

import com.waterx.safety.auth.CurrentUser;
import com.waterx.safety.common.BusinessException;
import com.waterx.safety.site.SiteAccessService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/safety/assets")
public class SafetyAssetController {
 private final JdbcClient jdbc; private final SiteAccessService sites;
 public SafetyAssetController(JdbcClient jdbc,SiteAccessService sites){this.jdbc=jdbc;this.sites=sites;}

 @GetMapping("/summary") @PreAuthorize("hasAuthority('inspection:read')")
 Summary summary(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID s){sites.requireSiteAccess(u,s);return jdbc.sql("""
  select count(*),count(*) filter(where asset_type in ('SPECIAL_EQUIPMENT','SAFETY_ACCESSORY')),
  count(*) filter(where asset_type in ('EMERGENCY_SUPPLY','FIRE_EQUIPMENT')),
  count(*) filter(where (next_inspection_on is not null and next_inspection_on<=current_date+reminder_days) or (expires_on is not null and expires_on<=current_date+reminder_days))
  from safety_asset where tenant_id=:t and site_id=:s and status='IN_SERVICE'
  """).param("t",u.tenantId()).param("s",s).query((r,n)->new Summary(r.getInt(1),r.getInt(2),r.getInt(3),r.getInt(4))).single();}

 @GetMapping @PreAuthorize("hasAuthority('inspection:read')")
 List<Asset> list(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID s){sites.requireSiteAccess(u,s);return jdbc.sql("""
  select a.id,a.asset_no,a.asset_name,a.asset_type,a.category,a.location,a.responsible_person,a.model_spec,a.registration_no,a.quantity,a.unit,
  a.last_inspected_on,a.next_inspection_on,a.expires_on,a.reminder_days,a.status,
  case when (a.next_inspection_on<current_date or a.expires_on<current_date) then 'OVERDUE'
       when (a.next_inspection_on<=current_date+a.reminder_days or a.expires_on<=current_date+a.reminder_days) then 'DUE_SOON' else 'NORMAL' end due_status,
  (select count(*) from safety_asset_maintenance m where m.tenant_id=a.tenant_id and m.asset_id=a.id) maintenance_count
  from safety_asset a where a.tenant_id=:t and a.site_id=:s order by due_status desc,a.asset_no
  """).param("t",u.tenantId()).param("s",s).query((r,n)->new Asset(r.getObject(1,UUID.class),r.getString(2),r.getString(3),r.getString(4),r.getString(5),r.getString(6),r.getString(7),r.getString(8),r.getString(9),r.getBigDecimal(10),r.getString(11),r.getObject(12,LocalDate.class),r.getObject(13,LocalDate.class),r.getObject(14,LocalDate.class),r.getInt(15),r.getString(16),r.getString(17),r.getInt(18))).list();}

 @PostMapping @PreAuthorize("hasAuthority('inspection:manage')")
 Id create(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID s,@Valid @RequestBody AssetInput in){sites.requireSiteAccess(u,s);UUID id=UUID.randomUUID();jdbc.sql("""
  insert into safety_asset(id,tenant_id,site_id,asset_no,asset_name,asset_type,category,location,responsible_person,manufacturer,model_spec,registration_no,quantity,unit,commissioned_on,last_inspected_on,next_inspection_on,expires_on,reminder_days,notes)
  values(:id,:t,:s,:no,:name,:type,:category,:location,:responsible,:manufacturer,:model,:registration,:quantity,:unit,:commissioned,:lastInspection,:nextInspection,:expires,:reminder,:notes)
  """).param("id",id).param("t",u.tenantId()).param("s",s).param("no",in.assetNo()).param("name",in.assetName()).param("type",in.assetType()).param("category",in.category()).param("location",in.location()).param("responsible",in.responsiblePerson()).param("manufacturer",in.manufacturer()).param("model",in.modelSpec()).param("registration",in.registrationNo()).param("quantity",in.quantity()).param("unit",in.unit()).param("commissioned",in.commissionedOn()).param("lastInspection",in.lastInspectedOn()).param("nextInspection",in.nextInspectionOn()).param("expires",in.expiresOn()).param("reminder",in.reminderDays()).param("notes",in.notes()).update();return new Id(id);}

 @PostMapping("/{id}/maintenance") @PreAuthorize("hasAuthority('inspection:manage')")
 Id maintain(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID s,@PathVariable UUID id,@Valid @RequestBody MaintenanceInput in){sites.requireSiteAccess(u,s);int exists=jdbc.sql("select count(*) from safety_asset where tenant_id=:t and site_id=:s and id=:id").param("t",u.tenantId()).param("s",s).param("id",id).query(Integer.class).single();if(exists==0)throw new BusinessException("ASSET_NOT_FOUND","设备或物资不存在",HttpStatus.NOT_FOUND);UUID record=UUID.randomUUID();jdbc.sql("insert into safety_asset_maintenance(id,tenant_id,site_id,asset_id,maintenance_type,performed_on,performed_by,result,description,next_due_on,cost) values(:record,:t,:s,:id,:type,:on,:by,:result,:description,:next,:cost)").param("record",record).param("t",u.tenantId()).param("s",s).param("id",id).param("type",in.maintenanceType()).param("on",in.performedOn()).param("by",in.performedBy()).param("result",in.result()).param("description",in.description()).param("next",in.nextDueOn()).param("cost",in.cost()).update();jdbc.sql("update safety_asset set last_inspected_on=:on,next_inspection_on=coalesce(:next,next_inspection_on) where tenant_id=:t and id=:id").param("on",in.performedOn()).param("next",in.nextDueOn()).param("t",u.tenantId()).param("id",id).update();return new Id(record);}

 public record Summary(int total,int specialEquipment,int emergencyAndFire,int dueSoon){}
 public record Asset(UUID id,String assetNo,String assetName,String assetType,String category,String location,String responsiblePerson,String modelSpec,String registrationNo,BigDecimal quantity,String unit,LocalDate lastInspectedOn,LocalDate nextInspectionOn,LocalDate expiresOn,int reminderDays,String status,String dueStatus,int maintenanceCount){}
 public record AssetInput(@NotBlank String assetNo,@NotBlank String assetName,@NotBlank String assetType,String category,@NotBlank String location,String responsiblePerson,String manufacturer,String modelSpec,String registrationNo,@Positive BigDecimal quantity,@NotBlank String unit,LocalDate commissionedOn,LocalDate lastInspectedOn,LocalDate nextInspectionOn,LocalDate expiresOn,@Min(1) int reminderDays,String notes){}
 public record MaintenanceInput(@NotBlank String maintenanceType,@NotNull LocalDate performedOn,@NotBlank String performedBy,@NotBlank String result,@NotBlank String description,LocalDate nextDueOn,@PositiveOrZero BigDecimal cost){}
 public record Id(UUID id){}
}

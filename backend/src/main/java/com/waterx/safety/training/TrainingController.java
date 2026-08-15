package com.waterx.safety.training;

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

import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/safety/training")
public class TrainingController {
    private final JdbcClient jdbc; private final SiteAccessService sites;
    public TrainingController(JdbcClient jdbc,SiteAccessService sites){this.jdbc=jdbc;this.sites=sites;}

    @GetMapping("/summary") @PreAuthorize("hasAuthority('employee:read')")
    Summary summary(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site){sites.requireSiteAccess(u,site);return jdbc.sql("""
      select (select count(*) from safety_training_course where tenant_id=:t and status='ACTIVE') courses,
      (select count(*) from safety_training_assignment where tenant_id=:t and site_id=:s and status<>'COMPLETED') pending,
      (select count(*) from safety_training_assignment where tenant_id=:t and site_id=:s and status='COMPLETED') completed,
      (select count(*) from employee_qualification where tenant_id=:t and site_id=:s and expires_on<=current_date+reminder_days) expiring
      """).param("t",u.tenantId()).param("s",site).query((rs,n)->new Summary(rs.getInt(1),rs.getInt(2),rs.getInt(3),rs.getInt(4))).single();}

    @GetMapping("/courses") @PreAuthorize("hasAuthority('employee:read')")
    List<Course> courses(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site){sites.requireSiteAccess(u,site);return jdbc.sql("select id,code,name,course_type,material_type,duration_minutes,passing_score,status from safety_training_course where tenant_id=:t and (site_id is null or site_id=:s) order by created_at desc").param("t",u.tenantId()).param("s",site).query((r,n)->new Course(r.getObject(1,UUID.class),r.getString(2),r.getString(3),r.getString(4),r.getString(5),r.getInt(6),r.getInt(7),r.getString(8))).list();}

    @PostMapping("/courses") @PreAuthorize("hasAuthority('employee:manage')")
    Id course(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@Valid @RequestBody CourseInput in){sites.requireSiteAccess(u,site);UUID id=UUID.randomUUID();jdbc.sql("insert into safety_training_course(id,tenant_id,site_id,code,name,course_type,material_type,duration_minutes,passing_score) values(:id,:t,:s,:code,:name,:type,:material,:duration,:score)").param("id",id).param("t",u.tenantId()).param("s",site).param("code",in.code()).param("name",in.name()).param("type",in.courseType()).param("material",in.materialType()).param("duration",in.durationMinutes()).param("score",in.passingScore()).update();return new Id(id);}

    @GetMapping("/assignments") @PreAuthorize("hasAuthority('employee:read')")
    List<Assignment> assignments(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site){sites.requireSiteAccess(u,site);return jdbc.sql("""
      select a.id,c.name,e.display_name,a.due_at,a.study_progress,a.exam_score,a.status,a.completed_at
      from safety_training_assignment a join safety_training_course c on c.tenant_id=a.tenant_id and c.id=a.course_id
      join employee e on e.tenant_id=a.tenant_id and e.id=a.employee_id where a.tenant_id=:t and a.site_id=:s order by a.due_at
      """).param("t",u.tenantId()).param("s",site).query((r,n)->new Assignment(r.getObject(1,UUID.class),r.getString(2),r.getString(3),r.getObject(4,OffsetDateTime.class),r.getInt(5),(Integer)r.getObject(6),r.getString(7),r.getObject(8,OffsetDateTime.class))).list();}

    @PostMapping("/assignments") @PreAuthorize("hasAuthority('employee:manage')")
    Id assign(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@Valid @RequestBody AssignInput in){sites.requireSiteAccess(u,site);UUID id=UUID.randomUUID();jdbc.sql("insert into safety_training_assignment(id,tenant_id,site_id,course_id,employee_id,due_at) values(:id,:t,:s,:c,:e,:due)").param("id",id).param("t",u.tenantId()).param("s",site).param("c",in.courseId()).param("e",in.employeeId()).param("due",in.dueAt()).update();return new Id(id);}

    @PostMapping("/assignments/{id}/complete") @PreAuthorize("hasAuthority('employee:manage')")
    void complete(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@PathVariable UUID id,@Valid @RequestBody CompleteInput in){sites.requireSiteAccess(u,site);Integer pass=jdbc.sql("select c.passing_score from safety_training_assignment a join safety_training_course c on c.tenant_id=a.tenant_id and c.id=a.course_id where a.tenant_id=:t and a.site_id=:s and a.id=:id").param("t",u.tenantId()).param("s",site).param("id",id).query(Integer.class).optional().orElseThrow(()->new BusinessException("TRAINING_NOT_FOUND","培训任务不存在",HttpStatus.NOT_FOUND));String status=in.score()>=pass?"COMPLETED":"FAILED";jdbc.sql("update safety_training_assignment set study_progress=100,exam_score=:score,status=:status,completed_at=case when :status='COMPLETED' then now() else null end where tenant_id=:t and id=:id").param("score",in.score()).param("status",status).param("t",u.tenantId()).param("id",id).update();}

    @GetMapping("/qualifications") @PreAuthorize("hasAuthority('employee:read')")
    List<Qualification> qualifications(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site){sites.requireSiteAccess(u,site);return jdbc.sql("""
      select q.id,e.display_name,q.qualification_type,q.certificate_name,q.certificate_no,q.issuing_authority,q.issued_on,q.expires_on,q.reminder_days,
      case when q.expires_on<current_date then 'EXPIRED' when q.expires_on<=current_date+q.reminder_days then 'EXPIRING' else 'VALID' end display_status
      from employee_qualification q join employee e on e.tenant_id=q.tenant_id and e.id=q.employee_id where q.tenant_id=:t and q.site_id=:s order by q.expires_on
      """).param("t",u.tenantId()).param("s",site).query((r,n)->new Qualification(r.getObject(1,UUID.class),r.getString(2),r.getString(3),r.getString(4),r.getString(5),r.getString(6),r.getObject(7,LocalDate.class),r.getObject(8,LocalDate.class),r.getInt(9),r.getString(10))).list();}

    @PostMapping("/qualifications") @PreAuthorize("hasAuthority('employee:manage')")
    Id qualification(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@Valid @RequestBody QualificationInput in){sites.requireSiteAccess(u,site);UUID id=UUID.randomUUID();jdbc.sql("insert into employee_qualification(id,tenant_id,site_id,employee_id,qualification_type,certificate_name,certificate_no,issuing_authority,issued_on,expires_on,reminder_days) values(:id,:t,:s,:employee,:type,:name,:no,:authority,:issued,:expires,:days)").param("id",id).param("t",u.tenantId()).param("s",site).param("employee",in.employeeId()).param("type",in.qualificationType()).param("name",in.certificateName()).param("no",in.certificateNo()).param("authority",in.issuingAuthority()).param("issued",in.issuedOn()).param("expires",in.expiresOn()).param("days",in.reminderDays()).update();return new Id(id);}

    @GetMapping("/statistics") @PreAuthorize("hasAuthority('employee:read')")
    Statistics statistics(@AuthenticationPrincipal CurrentUser u,@RequestHeader("X-Site-Id") UUID site,@RequestParam LocalDate from,@RequestParam LocalDate to){sites.requireSiteAccess(u,site);return jdbc.sql("select count(*),count(*) filter(where status='COMPLETED'),count(*) filter(where status='FAILED'),coalesce(round(avg(exam_score),2),0) from safety_training_assignment where tenant_id=:t and site_id=:s and assigned_at::date between :from and :to").param("t",u.tenantId()).param("s",site).param("from",from).param("to",to).query((r,n)->new Statistics(from,to,r.getInt(1),r.getInt(2),r.getInt(3),r.getBigDecimal(4))).single();}

    public record Summary(int courseCount,int pendingAssignments,int completedAssignments,int expiringQualifications){}
    public record Course(UUID id,String code,String name,String courseType,String materialType,int durationMinutes,int passingScore,String status){}
    public record Assignment(UUID id,String courseName,String employeeName,OffsetDateTime dueAt,int studyProgress,Integer examScore,String status,OffsetDateTime completedAt){}
    public record Qualification(UUID id,String employeeName,String qualificationType,String certificateName,String certificateNo,String issuingAuthority,LocalDate issuedOn,LocalDate expiresOn,int reminderDays,String status){}
    public record AssignInput(@NotNull UUID courseId,@NotNull UUID employeeId,@NotNull OffsetDateTime dueAt){}
    public record CourseInput(@NotBlank String code,@NotBlank String name,@NotBlank String courseType,@NotBlank String materialType,@Positive int durationMinutes,@Min(0) @Max(100) int passingScore){}
    public record CompleteInput(@Min(0) @Max(100) int score){} public record Id(UUID id){}
    public record QualificationInput(@NotNull UUID employeeId,@NotBlank String qualificationType,@NotBlank String certificateName,@NotBlank String certificateNo,String issuingAuthority,LocalDate issuedOn,@NotNull LocalDate expiresOn,@Min(1) int reminderDays){}
    public record Statistics(LocalDate from,LocalDate to,int assignedCount,int completedCount,int failedCount,java.math.BigDecimal averageScore){}
}

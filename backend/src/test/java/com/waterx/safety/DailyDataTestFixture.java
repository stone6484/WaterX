package com.waterx.safety;

import com.waterx.safety.auth.CurrentUser;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

final class DailyDataTestFixture {
    static final UUID TENANT=UUID.fromString("10000000-0000-0000-0000-000000000001"), SITE=UUID.fromString("30000000-0000-0000-0000-000000000001"), OTHER=UUID.fromString("30000000-0000-0000-0000-000000000002");
    static UUID id(String key){return UUID.nameUUIDFromBytes(("process-daily-"+key).getBytes(StandardCharsets.UTF_8));}
    static final UUID LINE=id("line-a"), LINE_B=id("line-b");
    static final List<String[]> ACTORS=List.of(
        new String[]{"operator_a","运行工甲","PROCESS_OPERATOR"},new String[]{"operator_b","运行工乙","PROCESS_OPERATOR"},
        new String[]{"manager_a","工艺经理甲","PROCESS_MANAGER"},new String[]{"manager_b","工艺经理乙","PROCESS_MANAGER"},
        new String[]{"plant_manager","厂长甲","PROCESS_OBSERVER"},new String[]{"production_manager","生产负责人甲","PROCESS_OBSERVER"},
        new String[]{"equipment_manager","设备经理甲","EMPLOYEE"},new String[]{"maintenance_a","维修工甲","EMPLOYEE"},
        new String[]{"lab_a","化验员甲","EMPLOYEE"},new String[]{"safety_a","安全员甲","EMPLOYEE"});
    static void seed(JdbcClient db,PasswordEncoder encoder,String password)throws Exception{
        String template=new String(Objects.requireNonNull(DailyDataTestFixture.class.getResourceAsStream("/process-daily-template.json")).readAllBytes(),StandardCharsets.UTF_8);
        db.sql("update site set name='试点水厂' where id=:id").param("id",SITE).update();
        for(UUID line:List.of(LINE,LINE_B))db.sql("insert into process_daily_line(id,tenant_id,site_id,name,template) values(:id,:tenant,:site,:name,cast(:template as jsonb)) on conflict(id) do nothing").param("id",line).param("tenant",TENANT).param("site",SITE).param("name",line.equals(LINE)?"一期生化线":"二期生化线（范围验证）").param("template",template).update();
        for(String[] actor:ACTORS){
            UUID person=id(actor[0]+"-employee"),user=id(actor[0]);
            db.sql("insert into employee(id,tenant_id,site_id,employee_no,display_name,status) values(:id,:tenant,:site,:no,:name,'ACTIVE') on conflict(id) do update set status='ACTIVE'").param("id",person).param("tenant",TENANT).param("site",SITE).param("no","pd_"+actor[0]).param("name",actor[1]).update();
            db.sql("insert into user_account(id,tenant_id,employee_id,username,password_hash,status,must_change_password) values(:id,:tenant,:employee,:name,:hash,'ACTIVE',false) on conflict(id) do update set status='ACTIVE'").param("id",user).param("tenant",TENANT).param("employee",person).param("name","pd_"+actor[0]).param("hash",encoder.encode(password)).update();
            grant(db,user,actor[2],SITE,LINE);
        }
    }
    static UUID grant(JdbcClient db,UUID user,String role,UUID site,UUID line){UUID scope=UUID.randomUUID();
        db.sql("insert into user_role_scope(id,tenant_id,user_id,role_id,scope_type,scope_id) select :id,tenant_id,:user,id,'SITE',:site from role where tenant_id=:tenant and code=:role").param("id",scope).param("user",user).param("site",site).param("tenant",TENANT).param("role",role).update();
        db.sql("insert into process_daily_line_scope(scope_id,line_id) values(:scope,:line)").param("scope",scope).param("line",line).update();return scope;
    }
    static CurrentUser user(String key){return new CurrentUser(id(key),TENANT,"pd_"+key,key,false,Set.of());}
}

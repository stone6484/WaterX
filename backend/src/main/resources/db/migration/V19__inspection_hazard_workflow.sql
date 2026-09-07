-- Additive workflow upgrade. Keep source templates, historical categories and records.
alter table inspection_template add column family_code varchar(100);
update inspection_template set family_code=code;
alter table inspection_template alter column family_code set not null;
alter table inspection_template add column version integer not null default 1;
alter table inspection_template add column source_name text;
alter table inspection_template add column instructions text;
alter table inspection_template_item add column question_type varchar(20) not null default 'COMPLIANCE'
 check (question_type in ('COMPLIANCE','CONDITION','OBSERVATION','TEXT','NUMBER'));
alter table inspection_template_item add column condition_item_id uuid;
alter table inspection_template_item add column source_ref text;

alter table inspection_task add column template_version integer;
alter table inspection_task add column template_name text;
alter table inspection_task add column snapshot_origin varchar(30) not null default 'AT_CREATION';
alter table inspection_task add column completed_by uuid;
alter table inspection_task add column inspection_location text;
alter table inspection_task add column participants text;
alter table inspection_task add column signature_data text;
create table inspection_task_item (
 tenant_id uuid not null,site_id uuid not null,task_id uuid not null,item_id uuid not null,
 category text not null,content text not null,required boolean not null,sort_order integer not null,
 question_type varchar(20) not null,condition_item_id uuid,source_ref text,
 primary key(tenant_id,task_id,item_id),
 foreign key(tenant_id,task_id) references inspection_task(tenant_id,id)
);
create function snapshot_inspection_task() returns trigger language plpgsql as $$
begin
 update inspection_task set template_version=t.version,template_name=t.name
 from inspection_template t where inspection_task.id=new.id and t.id=new.template_id and t.tenant_id=new.tenant_id;
 insert into inspection_task_item
 select new.tenant_id,new.site_id,new.id,i.id,i.category,i.content,i.required,i.sort_order,i.question_type,i.condition_item_id,i.source_ref
 from inspection_template_item i where i.tenant_id=new.tenant_id and i.template_id=new.template_id;
 return new;
end $$;
create trigger inspection_task_snapshot after insert on inspection_task for each row execute function snapshot_inspection_task();
update inspection_task k set template_version=t.version,template_name=t.name,snapshot_origin='LEGACY_CAPTURE'
 from inspection_template t where k.template_id=t.id and k.tenant_id=t.tenant_id;
insert into inspection_task_item
 select k.tenant_id,k.site_id,k.id,i.id,i.category,i.content,i.required,i.sort_order,i.question_type,i.condition_item_id,i.source_ref
 from inspection_task k join inspection_template_item i on i.tenant_id=k.tenant_id and i.template_id=k.template_id;
alter table inspection_result drop constraint inspection_result_result_check;
alter table inspection_result add constraint inspection_result_result_check check(result in ('COMPLIANT','NON_COMPLIANT','NOT_APPLICABLE','RECORDED'));
alter table inspection_result add column answer text;
alter table inspection_result add column not_applicable_reason text;
alter table inspection_result add column linked_hazard_id uuid;

alter table safety_hazard alter column category_major drop not null;
alter table safety_hazard alter column hazard_level drop not null;
alter table safety_hazard alter column rectification_measure drop not null;
alter table safety_hazard alter column due_date drop not null;
alter table safety_hazard alter column estimated_cost drop not null;
alter table safety_hazard alter column estimated_cost drop default;
alter table safety_hazard drop constraint safety_hazard_hazard_level_check;
alter table safety_hazard add constraint safety_hazard_hazard_level_check check(hazard_level in ('GENERAL','SERIOUS','LARGER','MAJOR'));
alter table safety_hazard drop constraint safety_hazard_status_check;
alter table safety_hazard add constraint safety_hazard_status_check check(status in ('OPEN','PENDING_ACCEPTANCE','ASSIGNED','RECTIFYING','REVIEW_PENDING','CLOSED','OVERDUE'));
alter table safety_hazard add column revision integer not null default 1;
alter table safety_hazard add column reported_by uuid;
alter table safety_hazard add column request_key uuid;
alter table safety_hazard add column risk_hazard_id uuid;
alter table safety_hazard add column legal_major_status varchar(20) not null default 'UNDETERMINED' check(legal_major_status in ('UNDETERMINED','YES','NO'));
alter table safety_hazard add column legal_major_basis text;
alter table safety_hazard add column legacy_category_major text;
alter table safety_hazard add column rectification_submitted_by uuid;
alter table safety_hazard add column reviewed_by uuid;
alter table safety_hazard add column received_at timestamptz;
alter table safety_hazard add column rectification_signature text;
alter table safety_hazard add column review_signature text;
update safety_hazard set legacy_category_major=category_major;
-- OVERDUE is now a derived flag. Preserve the old state in the migration event.
create table safety_hazard_event (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null,site_id uuid not null,hazard_id uuid not null,
 action varchar(40) not null,actor_user_id uuid,actor_name text,note text not null,
 revision integer not null,snapshot jsonb not null,evidence_ids jsonb not null default '[]',occurred_at timestamptz not null default now(),
 foreign key(tenant_id,hazard_id) references safety_hazard(tenant_id,id)
);
insert into safety_hazard_event(tenant_id,site_id,hazard_id,action,actor_name,note,revision,snapshot)
 select tenant_id,site_id,id,'LEGACY_CAPTURE','历史导入','升级前记录快照；不推定缺失的原始操作人或证据',revision,to_jsonb(h) from safety_hazard h;
update safety_hazard set status=case when responsible_employee_id is null then 'PENDING_ACCEPTANCE' else 'RECTIFYING' end
 where status in ('OPEN','OVERDUE','RECTIFYING');
create unique index uq_hazard_request on safety_hazard(tenant_id,site_id,reported_by,request_key) where request_key is not null;
create table safety_hazard_origin (
 tenant_id uuid not null,site_id uuid not null,hazard_id uuid not null,task_id uuid not null,item_id uuid not null,
 description text not null,discovered_at timestamptz not null default now(),
 primary key(tenant_id,task_id,item_id),foreign key(tenant_id,hazard_id) references safety_hazard(tenant_id,id)
);
create index idx_hazard_event_history on safety_hazard_event(tenant_id,site_id,hazard_id,occurred_at);
create index idx_hazard_responsibility on safety_hazard(tenant_id,site_id,responsible_employee_id,status);

do $$ declare ten uuid; tpl uuid; ids uuid[]; begin
 for ten in select id from tenant loop
 tpl:=gen_random_uuid(); ids:=array[]::uuid[];
 insert into inspection_template(id,tenant_id,code,name,inspection_type,frequency,family_code,source_name,instructions) values(tpl,ten,'SOURCE-COMPREHENSIVE','安全生产检查记录单','COMPREHENSIVE','按计划','SOURCE-COMPREHENSIVE','5-1-2综合性安全检查记录单_V1.2.docx','来源为企业检查表，现场适用性由安全负责人维护；题干保留原意，不等同法定阈值。原表为开放式记录单，无固定检查条目；问题可逐条记录并关联整改，整改意见由专业受理环节填写。');
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[1],ten,tpl,'综合检查','记录本次检查范围和发现的问题；未发现问题时明确填写“未发现问题”。',1,'TEXT','原表一、检查出的问题',null);
 end loop; end $$;

do $$ declare ten uuid; tpl uuid; ids uuid[]; begin
 for ten in select id from tenant loop
 tpl:=gen_random_uuid(); ids:=array[]::uuid[];
 insert into inspection_template(id,tenant_id,code,name,inspection_type,frequency,family_code,source_name,instructions) values(tpl,ten,'SOURCE-KEY-AREA','公司每周重点部位安全检查表','KEY_AREA','每周','SOURCE-KEY-AREA','5-1-3重点部位安全检查表_V1.2.docx','来源为企业检查表，现场适用性由安全负责人维护；题干保留原意，不等同法定阈值。');
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[1],ten,tpl,'预处理','护栏牢固可靠，救生圈、救援绳配备齐全？',1,'COMPLIANCE','表1第3行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[2],ten,tpl,'预处理','除臭装置密闭良好，无臭气溢散？',2,'COMPLIANCE','表1第3行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[3],ten,tpl,'预处理','盖板完好无缺失锈蚀？',3,'COMPLIANCE','表1第3行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[4],ten,tpl,'预处理','设备转动部位防护良好？',4,'COMPLIANCE','表1第3行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[5],ten,tpl,'配电室','配电室防小动物、防火等安全措施有效，室内温度、通风和应急照明良好？',5,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[6],ten,tpl,'配电室','按要求配备了绝缘工具及劳动防护用品，定期进行了检验检测，有检测报告？',6,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[7],ten,tpl,'配电室','配电室八项管理制度齐全，且上墙？',7,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[8],ten,tpl,'配电室','低压配电室配有二氧化碳灭火器，高压配电室配有干粉灭火器，且定期检验合格？',8,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[9],ten,tpl,'配电室','进入配电室执行检维修、清扫、抄表等作业人员持证上岗？',9,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[10],ten,tpl,'配电室','无证人员进入配电室由高低压电工陪同监护，并做好登记？',10,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[11],ten,tpl,'风机房','安全警示标志齐全，有噪声职业病危害告知卡，设置耳塞取用处？',11,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[12],ten,tpl,'风机房','灭火器配备充足，且在合格有效期内？',12,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[13],ten,tpl,'机修间','各机修设备安全操作规程规范有效且上墙？',13,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[14],ten,tpl,'机修间','气瓶间距符合要求，有防倾倒措施，阀门及压力表齐全有效？',14,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[15],ten,tpl,'机修间','工器具摆放整齐，设备工具防护装置完好？',15,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[16],ten,tpl,'机修间','一机一漏保，漏电保护器功能完好？',16,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[17],ten,tpl,'压力容器','外观无锈蚀，工作正常？',17,'COMPLIANCE','表1第7行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[18],ten,tpl,'压力容器','压力表、泄压阀等安全附件配备齐全，且合格有效？',18,'COMPLIANCE','表1第7行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[19],ten,tpl,'起重机械及吊具','主要受力构件无明显的连接缺陷、腐蚀、变形和开裂？',19,'COMPLIANCE','表1第8行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[20],ten,tpl,'起重机械及吊具','吊钩转动灵活表面光洁，无裂缝、剥裂情况？',20,'COMPLIANCE','表1第8行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[21],ten,tpl,'起重机械及吊具','钢丝绳不应有扭结、压扁、弯折、畸变、断股、绳芯挤出或锈蚀情况？',21,'COMPLIANCE','表1第8行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[22],ten,tpl,'起重机械及吊具','吊机安全装置、限位装置齐全有效？',22,'COMPLIANCE','表1第8行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[23],ten,tpl,'化验室','化验室废弃液有指定临时存放点，存放处有警示标志，防溢流措施完善可靠？',23,'COMPLIANCE','表1第9行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[24],ten,tpl,'化验室','配备和合格有效的洗眼器？',24,'COMPLIANCE','表1第9行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[25],ten,tpl,'化验室','易制毒、易制爆等危险化学品执行“五双”管理？',25,'COMPLIANCE','表1第9行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[26],ten,tpl,'化验室','配备和合格有效的二氧化碳灭火器？',26,'COMPLIANCE','表1第9行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[27],ten,tpl,'危废存储间','防溢流设施安全可靠，存储间内通风良好？',27,'COMPLIANCE','表1第10行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[28],ten,tpl,'危废存储间','警示标志齐全，出入库记录完整？',28,'COMPLIANCE','表1第10行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[29],ten,tpl,'危废存储间','不同类型危废分类存放？',29,'COMPLIANCE','表1第10行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[30],ten,tpl,'加药间','存储和使用部位的防中毒、防喷溅、防泄漏、防静电、防滑跌、防火防爆措施有效？',30,'COMPLIANCE','表1第11行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[31],ten,tpl,'加药间','废弃的化学品包装箱、包装桶、包装袋等进行妥善处理和存放？',31,'COMPLIANCE','表1第11行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[32],ten,tpl,'加药间','合理设置化学品安全技术说明书（MSDS）、安全周知卡及职业病危害告知卡？',32,'COMPLIANCE','表1第11行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[33],ten,tpl,'加药间','配备和合格有效的洗眼器？',33,'COMPLIANCE','表1第11行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[34],ten,tpl,'加氯间','氯酸钠及盐酸存储符合危化品存储要求？防中毒、防喷溅、防泄漏、防静电、防滑跌和防火防爆措施齐全有效？',34,'COMPLIANCE','表1第12行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[35],ten,tpl,'加氯间','配备漏氯报警器，且工作正常？',35,'COMPLIANCE','表1第12行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[36],ten,tpl,'加氯间','视频监控系统使用正常？',36,'COMPLIANCE','表1第12行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[37],ten,tpl,'加氯间','现场配备防酸碱手套及护目镜，配备和合格有效的洗眼器？',37,'COMPLIANCE','表1第12行',null);
 end loop; end $$;

do $$ declare ten uuid; tpl uuid; ids uuid[]; begin
 for ten in select id from tenant loop
 tpl:=gen_random_uuid(); ids:=array[]::uuid[];
 insert into inspection_template(id,tenant_id,code,name,inspection_type,frequency,family_code,source_name,instructions) values(tpl,ten,'SOURCE-DAILY-QC','质控班组每日安全检查表','DAILY','每日','SOURCE-DAILY-QC','质控班组每日安全检查表_V1.2.docx','来源为企业检查表，现场适用性由安全负责人维护；题干保留原意，不等同法定阈值。每日单次保存，月度从逐日记录汇总；上下半月采用第一表口径，第二表措辞差异保留于来源。');
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[1],ten,tpl,'劳动纪律','到岗员工未酒后或服用嗜睡药物后上岗？',1,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[2],ten,tpl,'劳动纪律','到岗员工个人劳动防护用品穿戴齐全？',2,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[3],ten,tpl,'劳动纪律','到岗员工身体及精神状态良好，能够胜任当日工作任务？',3,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[4],ten,tpl,'安全操作','到岗化验员操作熟练，化验过程中严格遵守安全操作规程？',4,'COMPLIANCE','表1第7行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[5],ten,tpl,'安全操作','化学药剂存放、取用规范，严格履行“五双”管理要求？',5,'COMPLIANCE','表1第8行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[6],ten,tpl,'防护措施','洗眼器合格可靠，能够正常使用？',6,'COMPLIANCE','表1第9行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[7],ten,tpl,'防护措施','化验室配备二氧化碳灭火器，且合格有效？',7,'COMPLIANCE','表1第10行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[8],ten,tpl,'防护措施','通风柜通风效果良好？',8,'COMPLIANCE','表1第11行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[9],ten,tpl,'防护措施','灭菌锅外观完好，密闭性良好，压力表正常？',9,'COMPLIANCE','表1第12行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[10],ten,tpl,'危废管理','化验室废液使用专用容器临时存放，并定期转移到危废间？',10,'COMPLIANCE','表1第13行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[11],ten,tpl,'危废管理','废液临时存放处设置防溢流托盘？',11,'COMPLIANCE','表1第14行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[12],ten,tpl,'危废管理','废液临时存放点设置危废警示标志及危废标签？',12,'COMPLIANCE','表1第15行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[13],ten,tpl,'危废管理','废液的产生及转移情况及时如实进行记录？',13,'COMPLIANCE','表1第16行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[14],ten,tpl,'其他','检查过程中是否发现有其他安全隐患？',14,'OBSERVATION','表1第17行',null);
 end loop; end $$;

do $$ declare ten uuid; tpl uuid; ids uuid[]; begin
 for ten in select id from tenant loop
 tpl:=gen_random_uuid(); ids:=array[]::uuid[];
 insert into inspection_template(id,tenant_id,code,name,inspection_type,frequency,family_code,source_name,instructions) values(tpl,ten,'SOURCE-DAILY-OPS','运维班组每日安全检查表','DAILY','每日','SOURCE-DAILY-OPS','运维班组每日安全检查表_V1.2.docx','来源为企业检查表，现场适用性由安全负责人维护；题干保留原意，不等同法定阈值。每日单次保存，月度从逐日记录汇总；上下半月采用第一表口径，第二表措辞差异保留于来源。');
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[1],ten,tpl,'劳动纪律','到岗员工未酒后或服用嗜睡药物后上岗？',1,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[2],ten,tpl,'劳动纪律','到岗员工个人劳动防护用品穿戴齐全？',2,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[3],ten,tpl,'劳动纪律','到岗员工身体及精神状态良好，能够胜任当日工作任务？',3,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[4],ten,tpl,'危险作业','本班次是否涉及危险作业？',4,'CONDITION','表1第7行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[5],ten,tpl,'危险作业','危险作业履行审批手续，进行风险识别，采取防护措施？',5,'COMPLIANCE','表1第8行',ids[4]);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[6],ten,tpl,'设备运行维修作业','无设备旋转和运行中进行检修和维护作业的违章情况？',6,'COMPLIANCE','表1第9行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[7],ten,tpl,'设备运行维修作业','无设备带电情况下进行设备电气系统维修检修的违章情况？',7,'COMPLIANCE','表1第10行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[8],ten,tpl,'设备运行维修作业','设备各运转部件无异常声响，旋转部件的防护罩安装到位？',8,'COMPLIANCE','表1第11行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[9],ten,tpl,'设备运行维修作业','设备的运转状态无温度、压力或流量异常情况出现？',9,'COMPLIANCE','表1第12行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[10],ten,tpl,'设备运行维修作业','设备的电源线连接和防护管完好，保护接地线连接可靠？',10,'COMPLIANCE','表1第13行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[11],ten,tpl,'设备运行维修作业','管线、阀门无跑冒滴漏、异常震动和松动、腐蚀、堵塞等？',11,'COMPLIANCE','表1第14行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[12],ten,tpl,'设备运行维修作业','各处生产设备运行正常，防护装置可靠？',12,'COMPLIANCE','表1第15行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[13],ten,tpl,'相关方','本班次是否涉及委外施工作业？',13,'CONDITION','表1第16行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[14],ten,tpl,'相关方','作业前是否对委外施工作业人员进行安全交底？',14,'COMPLIANCE','表1第17行',ids[13]);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[15],ten,tpl,'相关方','是否对作业现场进行安全检查并安排专人监督？',15,'COMPLIANCE','表1第18行',ids[13]);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[16],ten,tpl,'其他','检查过程中是否发现有其他安全隐患？',16,'OBSERVATION','表1第19行',null);
 end loop; end $$;

do $$ declare ten uuid; tpl uuid; ids uuid[]; begin
 for ten in select id from tenant loop
 tpl:=gen_random_uuid(); ids:=array[]::uuid[];
 insert into inspection_template(id,tenant_id,code,name,inspection_type,frequency,family_code,source_name,instructions) values(tpl,ten,'SOURCE-WINTER','冬季专项安全检查表','SEASONAL','季节前','SOURCE-WINTER','冬季专项安全检查表_V1.0.docx','来源为企业检查表，现场适用性由安全负责人维护；题干保留原意，不等同法定阈值。');
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[1],ten,tpl,'防滑防冻','室内外设备、设施防冻措施是否已经落实？',1,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[2],ten,tpl,'防滑防冻','应对极端寒冷天气的应急物资是否准备充分？',2,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[3],ten,tpl,'防滑防冻','经常通行的步道、楼梯和路面确保无积水？',3,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[4],ten,tpl,'防滑防冻','已经结冻的是否及时进行了清理？',4,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[5],ten,tpl,'防滑防冻','各车间的门窗无破损，保温效果良好？',5,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[6],ten,tpl,'消防工作','厂区枯枝败叶是否清理干净，无易燃物堆积？',6,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[7],ten,tpl,'消防工作','消防设施的防冻工作是否做好，有无遗漏；',7,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[8],ten,tpl,'消防工作','住宿、办公场所无违章使用取暖器？',8,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[9],ten,tpl,'消防工作','消防设施是否配备齐全，并处于投用状态？',9,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[10],ten,tpl,'消防工作','员工熟练掌握各类消防器材使用？',10,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[11],ten,tpl,'防风','轻体设施的连接固定设施是否牢固；',11,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[12],ten,tpl,'防风','设施高处无落物隐患，零散构件固定牢固；',12,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[13],ten,tpl,'防风','路灯、栏杆和大型标识牌无松动脱落隐患。',13,'COMPLIANCE','表1第6行',null);
 end loop; end $$;

do $$ declare ten uuid; tpl uuid; ids uuid[]; begin
 for ten in select id from tenant loop
 tpl:=gen_random_uuid(); ids:=array[]::uuid[];
 insert into inspection_template(id,tenant_id,code,name,inspection_type,frequency,family_code,source_name,instructions) values(tpl,ten,'SOURCE-SUMMER','夏季专项安全检查表','SEASONAL','季节前','SOURCE-SUMMER','夏季专项安全检查表_V1.0.docx','来源为企业检查表，现场适用性由安全负责人维护；题干保留原意，不等同法定阈值。');
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[1],ten,tpl,'有限空间作业管理','是否开展夏季有限空间作业重点培训教育？',1,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[2],ten,tpl,'有限空间作业管理','有限空间作业各类应急救援装备是否完好？',2,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[3],ten,tpl,'有限空间作业管理','上半年是否开展了有限空间作业事故应急演练？',3,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[4],ten,tpl,'防暑降温','防暑降温药品是否准备齐全且在合格有效期？',4,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[5],ten,tpl,'防暑降温','职工是否了解预防中暑和中暑后的急救措施？',5,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[6],ten,tpl,'防暑降温','各处配电系统工作温度是否正常？',6,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[7],ten,tpl,'防暑降温','是否已组织开展防暑降温安全培训教育？',7,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[8],ten,tpl,'厂内防汛','高低压配电室、风机房等重要场所无漏雨？',8,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[9],ten,tpl,'厂内防汛','厂内各处排水设施是否完好，井、管道畅通？',9,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[10],ten,tpl,'厂内防汛','防汛应急预案是否完善，组建应急队伍？',10,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[11],ten,tpl,'厂内防汛','沙袋、抽水泵等防汛物资是否配备齐全？',11,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[12],ten,tpl,'厂内防汛','本年度是否已开展防汛应急演练？',12,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[13],ten,tpl,'防雷接地','一年内是否已开展防雷接地检测？',13,'COMPLIANCE','表1第7行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[14],ten,tpl,'防雷接地','构筑物及设备设施防雷接地电阻值是否正常？',14,'COMPLIANCE','表1第7行',null);
 end loop; end $$;

do $$ declare ten uuid; tpl uuid; ids uuid[]; begin
 for ten in select id from tenant loop
 tpl:=gen_random_uuid(); ids:=array[]::uuid[];
 insert into inspection_template(id,tenant_id,code,name,inspection_type,frequency,family_code,source_name,instructions) values(tpl,ten,'SOURCE-SPRING','春季专项安全检查表','SEASONAL','季节前','SOURCE-SPRING','春季专项安全检查表_V1.0.docx','来源为企业检查表，现场适用性由安全负责人维护；题干保留原意，不等同法定阈值。原表频次写“春（秋）季前”，此模板用于春季；秋季另有独立模板。');
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[1],ten,tpl,'消防','现场各处灭火器材配备、维护保养完好？',1,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[2],ten,tpl,'消防','消防水压是否符合要求，消防水泵完好？',2,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[3],ten,tpl,'消防','厂区枯枝败叶是否清理干净，无易燃物堆积？',3,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[4],ten,tpl,'消防','电气设备防火符合要求？',4,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[5],ten,tpl,'消防','消防通道是否畅通，无占用堵塞情况？',5,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[6],ten,tpl,'消防','工熟练掌握各类消防器材使用？',6,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[7],ten,tpl,'防风','轻体厂房是否墙体牢固，无严重锈蚀？',7,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[8],ten,tpl,'防风','设备、设施防雨棚罩牢固可靠？',8,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[9],ten,tpl,'防风','轻质、挡风面积大的设备设置固定牢固？',9,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[10],ten,tpl,'防静电','防静电设施进行全面检查，接地体完好？',10,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[11],ten,tpl,'防静电','员工进入易燃易爆品存储区穿防静电服？',11,'COMPLIANCE','表1第6行',null);
 end loop; end $$;

do $$ declare ten uuid; tpl uuid; ids uuid[]; begin
 for ten in select id from tenant loop
 tpl:=gen_random_uuid(); ids:=array[]::uuid[];
 insert into inspection_template(id,tenant_id,code,name,inspection_type,frequency,family_code,source_name,instructions) values(tpl,ten,'SOURCE-AUTUMN','秋季专项安全检查表','SEASONAL','季节前','SOURCE-AUTUMN','秋季专项安全检查表_V1.0.docx','来源为企业检查表，现场适用性由安全负责人维护；题干保留原意，不等同法定阈值。');
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[1],ten,tpl,'消防','现场各处灭火器材配备、维护保养完好？',1,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[2],ten,tpl,'消防','消防水压是否符合要求，消防水泵完好？',2,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[3],ten,tpl,'消防','厂区枯枝败叶是否清理干净，无易燃物堆积？',3,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[4],ten,tpl,'消防','电气设备防火符合要求？',4,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[5],ten,tpl,'消防','消防通道是否畅通，无占用堵塞情况？',5,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[6],ten,tpl,'消防','工熟练掌握各类消防器材使用？',6,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[7],ten,tpl,'防风','轻体厂房是否墙体牢固，无严重锈蚀？',7,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[8],ten,tpl,'防风','设备、设施防雨棚罩牢固可靠？',8,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[9],ten,tpl,'防风','轻质、挡风面积大的设备设置固定牢固？',9,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[10],ten,tpl,'防静电','防静电设施进行全面检查，接地体完好？',10,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[11],ten,tpl,'防静电','员工进入易燃易爆品存储区穿防静电服？',11,'COMPLIANCE','表1第6行',null);
 end loop; end $$;

do $$ declare ten uuid; tpl uuid; ids uuid[]; begin
 for ten in select id from tenant loop
 tpl:=gen_random_uuid(); ids:=array[]::uuid[];
 insert into inspection_template(id,tenant_id,code,name,inspection_type,frequency,family_code,source_name,instructions) values(tpl,ten,'SOURCE-HOLIDAY','节假日专项安全检查表','HOLIDAY','节假日前','SOURCE-HOLIDAY','5-1-6节假日安全检查表_V1.0.docx','来源为企业检查表，现场适用性由安全负责人维护；题干保留原意，不等同法定阈值。');
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[1],ten,tpl,'物资准备','生产物资贮备是否充足，是否能保证正常生产？',1,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[2],ten,tpl,'物资准备','应急救援物资是否准备充分？',2,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[3],ten,tpl,'物资准备','各类备用设备是否完好？',3,'COMPLIANCE','表1第4行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[4],ten,tpl,'应急管理','应急预案是否按规定定期组织了演练？',4,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[5],ten,tpl,'应急管理','应急救援器材、设备设施是否齐全完好？',5,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[6],ten,tpl,'应急管理','有关人员是否能够保证24小时通讯畅通？',6,'COMPLIANCE','表1第5行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[7],ten,tpl,'消防管理','消防设备设施、器材是否齐全、随时可用？',7,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[8],ten,tpl,'消防管理','消防通道是否畅通，无占用堵塞情况？',8,'COMPLIANCE','表1第6行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[9],ten,tpl,'保卫管理','门卫严格遵守公司规定，对进出人员进行登记检查？',9,'COMPLIANCE','表1第7行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[10],ten,tpl,'劳动纪律','厂区内无吸烟现象？',10,'COMPLIANCE','表1第8行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[11],ten,tpl,'劳动纪律','有无酒后上岗现象？',11,'OBSERVATION','表1第8行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[12],ten,tpl,'劳动纪律','当班人员无私自换岗、串岗、脱岗和睡岗情况？',12,'COMPLIANCE','表1第8行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[13],ten,tpl,'领导带班','制定了节假日领导带班值班表，值班人员电话畅通？',13,'COMPLIANCE','表1第9行',null);
 ids:=array_append(ids,gen_random_uuid()); insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order,question_type,source_ref,condition_item_id) values(ids[14],ten,tpl,'其他','集团及大区要求检查的内容是否落实？',14,'COMPLIANCE','表1第10行',null);
 end loop; end $$;

-- Existing demo templates remain available for old tasks/plans, but are explicitly labelled.
update inspection_template set source_name='历史示例模板（非完整原表）' where source_name is null;

insert into role_permission(tenant_id,role_id,permission_id)
 select r.tenant_id,r.id,p.id from role r cross join permission p
 where (r.code in ('SAFETY_MANAGER','PLANT_MANAGER') and p.code in ('inspection:read','inspection:manage','hazard:read','hazard:manage','risk:read'))
    or (r.code='EMPLOYEE' and p.code in ('inspection:read','hazard:read'))
 on conflict do nothing;

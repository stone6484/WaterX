create table occupational_hazard_factor (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenant(id),site_id uuid not null,
 factor_name varchar(100) not null,factor_type varchar(40) not null,location varchar(200) not null,exposed_positions varchar(500) not null,
 exposure_level varchar(100),limit_value varchar(100),control_measures text not null,monitoring_frequency varchar(40) not null,
 last_monitored_on date,next_monitoring_on date,status varchar(20) not null default 'ACTIVE',created_at timestamptz not null default now(),
 unique(tenant_id,id),foreign key(tenant_id,site_id) references site(tenant_id,id)
);
create table occupational_health_exam (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenant(id),site_id uuid not null,employee_id uuid not null,
 exam_type varchar(30) not null,exam_date date not null,medical_institution varchar(200) not null,conclusion varchar(30) not null,
 restricted_items text,follow_up_action text,next_exam_on date,created_at timestamptz not null default now(),
 foreign key(tenant_id,site_id) references site(tenant_id,id),foreign key(tenant_id,employee_id) references employee(tenant_id,id)
);
create table safety_budget_plan (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenant(id),site_id uuid not null,budget_year integer not null,
 category varchar(60) not null,planned_amount numeric(14,2) not null,description text not null,status varchar(20) not null default 'APPROVED',created_at timestamptz not null default now(),
 unique(tenant_id,id),foreign key(tenant_id,site_id) references site(tenant_id,id)
);
create table safety_expense (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenant(id),site_id uuid not null,budget_id uuid not null,
 expense_date date not null,amount numeric(14,2) not null,purpose varchar(300) not null,vendor varchar(200),invoice_no varchar(100),recorded_by varchar(100) not null,created_at timestamptz not null default now(),
 foreign key(tenant_id,site_id) references site(tenant_id,id),foreign key(tenant_id,budget_id) references safety_budget_plan(tenant_id,id)
);
create index idx_occ_monitoring_due on occupational_hazard_factor(tenant_id,site_id,next_monitoring_on);
create index idx_occ_exam_due on occupational_health_exam(tenant_id,site_id,next_exam_on);
create index idx_safety_expense_budget on safety_expense(tenant_id,budget_id,expense_date);

insert into occupational_hazard_factor(id,tenant_id,site_id,factor_name,factor_type,location,exposed_positions,exposure_level,limit_value,control_measures,monitoring_frequency,last_monitored_on,next_monitoring_on) values
('90000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','硫化氢','CHEMICAL','污水提升泵房、污泥处理区域','运行人员、运维人员','检测结果符合限值','按国家职业接触限值执行','加强通风与气体检测；配备便携检测仪和呼吸防护用品；执行有限空间制度','ANNUAL',current_date-interval '340 day',current_date+interval '25 day'),
('90000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','噪声','PHYSICAL','鼓风机房、脱水机房','运行人员、运维人员','检测结果符合限值','8小时等效声级按现行限值执行','设备隔声减振；限制接触时间；佩戴护耳器','ANNUAL',current_date-interval '180 day',current_date+interval '185 day');
insert into occupational_health_exam(tenant_id,site_id,employee_id,exam_type,exam_date,medical_institution,conclusion,follow_up_action,next_exam_on) values
('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000005','PERIODIC',current_date-interval '330 day','示例职业健康检查机构','FIT','继续做好噪声和有毒气体防护',current_date+interval '35 day');

insert into safety_budget_plan(id,tenant_id,site_id,budget_year,category,planned_amount,description) values
('91000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',extract(year from current_date)::int,'安全防护设施',120000,'安全防护设施完善、检测和维护'),
('91000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',extract(year from current_date)::int,'安全培训教育',30000,'从业人员安全培训、取证及复审'),
('91000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',extract(year from current_date)::int,'应急与消防',50000,'应急物资、消防器材和演练投入');
insert into safety_expense(tenant_id,site_id,budget_id,expense_date,amount,purpose,vendor,invoice_no,recorded_by) values
('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001',current_date-interval '20 day',18000,'有限空间气体检测仪检定及防护用品采购','示例供应商','FP-DEMO-001','安全经理（示例）'),
('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000002',current_date-interval '10 day',5000,'安全管理人员复审培训','示例培训机构','FP-DEMO-002','安全经理（示例）');

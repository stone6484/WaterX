create table safety_training_course (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), site_id uuid,
 code varchar(50) not null, name varchar(200) not null, course_type varchar(40) not null,
 material_type varchar(20) not null default 'DOCUMENT', material_url varchar(500), duration_minutes integer not null default 0,
 passing_score integer not null default 80, status varchar(20) not null default 'ACTIVE', created_at timestamptz not null default now(),
 unique(tenant_id,code), unique(tenant_id,id), foreign key(tenant_id,site_id) references site(tenant_id,id)
);
create table safety_training_assignment (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), site_id uuid not null,
 course_id uuid not null, employee_id uuid not null, assigned_at timestamptz not null default now(), due_at timestamptz not null,
 study_progress integer not null default 0, exam_score integer, status varchar(20) not null default 'PENDING', completed_at timestamptz,
 foreign key(tenant_id,site_id) references site(tenant_id,id), foreign key(tenant_id,course_id) references safety_training_course(tenant_id,id),
 foreign key(tenant_id,employee_id) references employee(tenant_id,id), unique(tenant_id,course_id,employee_id,due_at)
);
create table employee_qualification (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), site_id uuid not null,
 employee_id uuid not null, qualification_type varchar(40) not null, certificate_name varchar(200) not null,
 certificate_no varchar(100) not null, issuing_authority varchar(200), issued_on date, expires_on date not null,
 reminder_days integer not null default 30, status varchar(20) not null default 'VALID', created_at timestamptz not null default now(),
 foreign key(tenant_id,site_id) references site(tenant_id,id), foreign key(tenant_id,employee_id) references employee(tenant_id,id),
 unique(tenant_id,certificate_no)
);
create index idx_training_assignment_due on safety_training_assignment(tenant_id,site_id,status,due_at);
create index idx_employee_qualification_expiry on employee_qualification(tenant_id,site_id,expires_on);

insert into safety_training_course(id,tenant_id,site_id,code,name,course_type,material_type,duration_minutes,passing_score) values
('88000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',null,'TRAIN-NEW','新员工厂级安全教育','ONBOARDING','VIDEO',60,80),
('88000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001',null,'TRAIN-CONFINED','有限空间作业安全培训','SPECIAL_OPERATION','PPT',45,90),
('88000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001',null,'TRAIN-EMERGENCY','中毒窒息事故应急处置','EMERGENCY','DOCUMENT',30,80);
insert into safety_training_assignment(tenant_id,site_id,course_id,employee_id,due_at,status,study_progress) values
('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','88000000-0000-0000-0000-000000000002','41000000-0000-0000-0000-000000000005',now()+interval '7 day','PENDING',0);
insert into employee_qualification(tenant_id,site_id,employee_id,qualification_type,certificate_name,certificate_no,issuing_authority,issued_on,expires_on,reminder_days) values
('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000003','SAFETY_OFFICER','安全生产管理人员培训合格证','AQ-2026-DEMO-001','示例发证机构',current_date-interval '300 day',current_date+interval '25 day',30),
('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000005','SPECIAL_OPERATION','低压电工作业证','TZ-2025-DEMO-002','示例发证机构',current_date-interval '500 day',current_date+interval '180 day',60);

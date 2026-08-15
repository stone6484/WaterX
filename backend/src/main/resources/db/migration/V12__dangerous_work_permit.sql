create table work_permit_template (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), permit_type varchar(40) not null,
 name varchar(120) not null, status varchar(20) not null default 'ACTIVE', unique(tenant_id,permit_type), unique(tenant_id,id)
);
create table work_permit_measure_template (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), template_id uuid not null,
 content varchar(1000) not null, required boolean not null default true, sort_order integer not null,
 foreign key(tenant_id,template_id) references work_permit_template(tenant_id,id), unique(tenant_id,id)
);
create table work_permit (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), site_id uuid not null,
 template_id uuid not null, permit_no varchar(64) not null, work_unit varchar(200) not null, location varchar(300) not null,
 work_content text not null, work_level varchar(10) not null check(work_level in ('LEVEL_1','LEVEL_2','LEVEL_3')),
 risk_result text not null, start_at timestamptz not null, end_at timestamptz not null, responsible_person varchar(100) not null,
 guardian varchar(100) not null, workers text not null, related_permits varchar(500), special_data jsonb not null default '{}'::jsonb,
 status varchar(30) not null default 'DRAFT' check(status in ('DRAFT','PENDING_SAFETY','PENDING_PRINCIPAL','APPROVED','IN_PROGRESS','CLOSED','RETURNED','CANCELLED')),
 applicant_id uuid not null, submitted_at timestamptz, approved_at timestamptz, closed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_id,site_id,permit_no), unique(tenant_id,id), foreign key(tenant_id,site_id) references site(tenant_id,id),
 foreign key(tenant_id,template_id) references work_permit_template(tenant_id,id), foreign key(tenant_id,applicant_id) references user_account(tenant_id,id)
);
create table work_permit_measure (
 tenant_id uuid not null references tenant(id), site_id uuid not null, permit_id uuid not null, measure_template_id uuid not null,
 involved boolean not null default true, confirmed boolean not null default false, confirmer_id uuid, confirmed_at timestamptz,
 primary key(tenant_id,permit_id,measure_template_id), foreign key(tenant_id,permit_id) references work_permit(tenant_id,id),
 foreign key(tenant_id,measure_template_id) references work_permit_measure_template(tenant_id,id)
);
create table work_permit_approval (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), site_id uuid not null, permit_id uuid not null,
 approval_step varchar(30) not null, decision varchar(20) not null, comment varchar(1000) not null, approver_id uuid not null, approved_at timestamptz not null default now(),
 foreign key(tenant_id,permit_id) references work_permit(tenant_id,id), foreign key(tenant_id,approver_id) references user_account(tenant_id,id)
);
create index idx_work_permit_site_status on work_permit(tenant_id,site_id,status,start_at);

insert into work_permit_template(id,tenant_id,permit_type,name) values
('86000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','CONFINED_SPACE','有限空间作业'),
('86000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','HOT_WORK','动火作业'),
('86000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','TEMPORARY_ELECTRICITY','临时用电作业'),
('86000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','WORK_AT_HEIGHT','高处作业'),
('86000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','LIFTING','吊装作业'),
('86000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000001','EXCAVATION','动土作业'),
('86000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000001','BLIND_PLATE','盲板抽堵作业'),
('86000000-0000-0000-0000-000000000008','10000000-0000-0000-0000-000000000001','ROAD_BLOCKING','断路作业'),
('86000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000001','WATER_RELATED','涉水作业'),
('86000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000001','MAINTENANCE','设备检维修作业');
insert into work_permit_measure_template(tenant_id,template_id,content,sort_order) values
('10000000-0000-0000-0000-000000000001','86000000-0000-0000-0000-000000000001','制定有限空间作业方案并经审核批准',1),
('10000000-0000-0000-0000-000000000001','86000000-0000-0000-0000-000000000001','完成安全交底，作业人员和监护人员培训合格',2),
('10000000-0000-0000-0000-000000000001','86000000-0000-0000-0000-000000000001','隔离危险介质和转动设备并执行上锁挂牌',3),
('10000000-0000-0000-0000-000000000001','86000000-0000-0000-0000-000000000001','完成通风和气体检测，应急救援设备齐备',4),
('10000000-0000-0000-0000-000000000001','86000000-0000-0000-0000-000000000002','清除动火点周围可燃物并配备消防器材',1),
('10000000-0000-0000-0000-000000000001','86000000-0000-0000-0000-000000000002','完成可燃气体检测并确认结果合格',2),
('10000000-0000-0000-0000-000000000001','86000000-0000-0000-0000-000000000002','动火设备、管线完成隔离、清洗和置换',3),
('10000000-0000-0000-0000-000000000001','86000000-0000-0000-0000-000000000002','监护人员、动火人员资质及防护用品符合要求',4);

insert into permission(id, code, name) values
('61000000-0000-0000-0000-000000000020','inspection:read','查看安全检查'),
('61000000-0000-0000-0000-000000000021','inspection:manage','管理安全检查'),
('61000000-0000-0000-0000-000000000022','hazard:read','查看事故隐患'),
('61000000-0000-0000-0000-000000000023','hazard:manage','管理事故隐患');

insert into role_permission(tenant_id, role_id, permission_id)
select '10000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', id
from permission where code in ('inspection:read','inspection:manage','hazard:read','hazard:manage');

create table inspection_template (
    id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id),
    site_id uuid, code varchar(64) not null, name varchar(200) not null,
    inspection_type varchar(30) not null check (inspection_type in ('COMPREHENSIVE','KEY_AREA','DAILY','SEASONAL','HOLIDAY','SPECIAL')),
    frequency varchar(30) not null, status varchar(20) not null default 'ACTIVE',
    created_at timestamptz not null default now(), unique(tenant_id, site_id, code), unique(tenant_id,id),
    foreign key (tenant_id,site_id) references site(tenant_id,id)
);

create table inspection_template_item (
    id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id),
    template_id uuid not null, category varchar(120) not null, content text not null,
    required boolean not null default true, sort_order integer not null, unique(tenant_id,id),
    foreign key (tenant_id,template_id) references inspection_template(tenant_id,id)
);

create table inspection_task (
    id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), site_id uuid not null,
    template_id uuid not null, task_no varchar(64) not null, title varchar(200) not null,
    planned_start date not null, due_at timestamptz not null, status varchar(30) not null check (status in ('PENDING','IN_PROGRESS','COMPLETED','OVERDUE','CANCELLED')),
    assignee_employee_id uuid, completed_at timestamptz, created_at timestamptz not null default now(),
    unique(tenant_id,site_id,task_no), unique(tenant_id,id),
    foreign key (tenant_id,site_id) references site(tenant_id,id),
    foreign key (tenant_id,template_id) references inspection_template(tenant_id,id),
    foreign key (tenant_id,assignee_employee_id) references employee(tenant_id,id)
);

create table inspection_result (
    id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), site_id uuid not null,
    task_id uuid not null, template_item_id uuid not null, result varchar(20) not null check (result in ('COMPLIANT','NON_COMPLIANT','NOT_APPLICABLE')),
    problem_description text, handling_measure text, checked_at timestamptz not null default now(),
    foreign key (tenant_id,task_id) references inspection_task(tenant_id,id),
    foreign key (tenant_id,template_item_id) references inspection_template_item(tenant_id,id),
    unique(tenant_id,task_id,template_item_id)
);

create table safety_hazard (
    id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), site_id uuid not null,
    hazard_no varchar(64) not null, source_type varchar(30) not null check (source_type in ('INSPECTION','EMPLOYEE_REPORT','SPECIAL_INVESTIGATION')),
    source_task_id uuid, location varchar(200) not null, name varchar(240) not null,
    category_major varchar(100) not null, category_minor varchar(120), description text not null,
    hazard_level varchar(20) not null check (hazard_level in ('GENERAL','SERIOUS','MAJOR')),
    rectification_measure text not null, temporary_measure text, due_date date not null,
    estimated_cost numeric(14,2) not null default 0, responsible_org_id uuid, responsible_employee_id uuid,
    status varchar(30) not null check (status in ('OPEN','RECTIFYING','REVIEW_PENDING','CLOSED','OVERDUE')),
    discovered_at timestamptz not null default now(), completed_at timestamptz, completion_note text,
    reviewed_at timestamptz, review_result varchar(20), review_comment text,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
    unique(tenant_id,site_id,hazard_no), unique(tenant_id,id),
    foreign key (tenant_id,site_id) references site(tenant_id,id),
    foreign key (tenant_id,source_task_id) references inspection_task(tenant_id,id),
    foreign key (tenant_id,responsible_org_id) references org_unit(tenant_id,id),
    foreign key (tenant_id,responsible_employee_id) references employee(tenant_id,id)
);

create index idx_inspection_task_site_status on inspection_task(tenant_id,site_id,status,due_at);
create index idx_safety_hazard_site_status on safety_hazard(tenant_id,site_id,status,due_date);

insert into inspection_template(id,tenant_id,site_id,code,name,inspection_type,frequency) values
('80000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',null,'TPL-KEY-AREA','重点部位安全检查表','KEY_AREA','每周'),
('80000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001',null,'TPL-DAILY-OPS','运维班组每日安全检查表','DAILY','每日'),
('80000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001',null,'TPL-HOLIDAY','节假日专项安全检查表','HOLIDAY','节假日前');

insert into inspection_template_item(id,tenant_id,template_id,category,content,sort_order) values
('81000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','预处理','护栏牢固可靠，救生圈、救援绳配备齐全',1),
('81000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','配电室','防小动物、防火、通风和应急照明等安全措施有效',2),
('81000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','加药间','防中毒、防喷溅、防泄漏、防滑和洗眼设施有效',3),
('81000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000002','劳动纪律','到岗员工未酒后上岗，劳动防护用品穿戴齐全',1),
('81000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000002','设备运行','设备运转部件、防护罩、温度压力及管线阀门无异常',2),
('81000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000003','应急管理','应急物资充足、器材完好、值班通讯保持畅通',1),
('81000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000003','消防管理','消防器材完好且消防通道保持畅通',2);

insert into inspection_task(id,tenant_id,site_id,template_id,task_no,title,planned_start,due_at,status,assignee_employee_id) values
('82000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','JC-P01-20260722-01','本周重点部位安全检查',current_date,current_date + interval '1 day','PENDING','41000000-0000-0000-0000-000000000003'),
('82000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000002','JC-P01-20260721-01','运维班组每日安全检查',current_date-1,current_date-1 + interval '20 hours','COMPLETED','41000000-0000-0000-0000-000000000004');

insert into safety_hazard(id,tenant_id,site_id,hazard_no,source_type,source_task_id,location,name,category_major,category_minor,description,hazard_level,rectification_measure,temporary_measure,due_date,estimated_cost,responsible_org_id,responsible_employee_id,status) values
('83000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','YH-P01-20260721-01','INSPECTION','82000000-0000-0000-0000-000000000002','加药间','洗眼器出水压力不足','设备设施及物料类','安全设备设施类','现场测试洗眼器出水压力不足，影响紧急冲洗效果','GENERAL','检修供水管路并完成出水压力测试','设置备用便携式洗眼器并张贴提示',current_date+3,800,'31000000-0000-0000-0000-000000000006','41000000-0000-0000-0000-000000000005','RECTIFYING'),
('83000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','YH-P01-20260720-01','EMPLOYEE_REPORT',null,'配电室','绝缘手套检验标识即将到期','设备设施及物料类','个人防护用品使用类','绝缘手套检验有效期不足一个月，应及时送检更换','GENERAL','送检绝缘手套并补充一副合格备用品','暂停使用临期手套，启用备用品',current_date+2,300,'31000000-0000-0000-0000-000000000006','41000000-0000-0000-0000-000000000003','REVIEW_PENDING');

update safety_hazard set completed_at=now(),completion_note='已完成送检并补充备用绝缘手套，检验报告已归档' where id='83000000-0000-0000-0000-000000000002';

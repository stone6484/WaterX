create table area (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    site_id uuid not null,
    parent_id uuid,
    code varchar(64) not null,
    name varchar(160) not null,
    area_type varchar(30) not null,
    status varchar(20) not null default 'ACTIVE',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, site_id, code),
    unique (tenant_id, id),
    foreign key (tenant_id, site_id) references site(tenant_id, id),
    foreign key (tenant_id, parent_id) references area(tenant_id, id)
);

create table risk_rule_version (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    code varchar(64) not null,
    name varchar(160) not null,
    method varchar(10) not null check (method in ('LS','LEC')),
    version_no integer not null,
    rule_snapshot jsonb not null,
    status varchar(20) not null check (status in ('DRAFT','ACTIVE','RETIRED')),
    effective_from date,
    created_at timestamptz not null default now(),
    unique (tenant_id, code, version_no),
    unique (tenant_id, id)
);

create table risk_object (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    site_id uuid not null,
    area_id uuid,
    code varchar(64) not null,
    name varchar(200) not null,
    object_type varchar(30) not null check (object_type in ('AREA','EQUIPMENT','ACTIVITY')),
    description text,
    responsible_org_id uuid,
    responsible_employee_id uuid,
    status varchar(20) not null default 'ACTIVE',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, site_id, code),
    unique (tenant_id, id),
    foreign key (tenant_id, site_id) references site(tenant_id, id),
    foreign key (tenant_id, area_id) references area(tenant_id, id),
    foreign key (tenant_id, responsible_org_id) references org_unit(tenant_id, id),
    foreign key (tenant_id, responsible_employee_id) references employee(tenant_id, id)
);

create table hazard_source (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    site_id uuid not null,
    risk_object_id uuid not null,
    code varchar(64) not null,
    hazard_factor text not null,
    possible_accident varchar(160) not null,
    accident_type varchar(80) not null,
    identification_basis text,
    identified_on date not null,
    identified_by uuid,
    status varchar(20) not null check (status in ('DRAFT','PENDING_REVIEW','ACTIVE','RETURNED','INACTIVE')),
    review_comment text,
    next_review_on date,
    version integer not null default 0,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, site_id, code),
    unique (tenant_id, id),
    foreign key (tenant_id, site_id) references site(tenant_id, id),
    foreign key (tenant_id, risk_object_id) references risk_object(tenant_id, id),
    foreign key (tenant_id, identified_by) references employee(tenant_id, id),
    foreign key (tenant_id, created_by) references user_account(tenant_id, id)
);

create table risk_assessment (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    site_id uuid not null,
    hazard_source_id uuid not null,
    rule_version_id uuid not null,
    method varchar(10) not null check (method in ('LS','LEC')),
    likelihood numeric(10,2) not null,
    severity numeric(10,2),
    exposure numeric(10,2),
    consequence numeric(10,2),
    risk_value numeric(12,2) not null,
    risk_level integer not null check (risk_level between 1 and 4),
    risk_color varchar(10) not null check (risk_color in ('RED','ORANGE','YELLOW','BLUE')),
    control_level varchar(40) not null,
    calculation_snapshot jsonb not null,
    assessed_by uuid,
    assessed_at timestamptz not null default now(),
    is_current boolean not null default true,
    unique (tenant_id, id),
    foreign key (tenant_id, site_id) references site(tenant_id, id),
    foreign key (tenant_id, hazard_source_id) references hazard_source(tenant_id, id),
    foreign key (tenant_id, rule_version_id) references risk_rule_version(tenant_id, id),
    foreign key (tenant_id, assessed_by) references user_account(tenant_id, id)
);

create unique index uq_current_risk_assessment
    on risk_assessment(tenant_id, hazard_source_id) where is_current;

create table risk_control_measure (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    site_id uuid not null,
    hazard_source_id uuid not null,
    measure_type varchar(30) not null check (measure_type in ('ENGINEERING','MANAGEMENT','TRAINING','PPE','EMERGENCY')),
    content text not null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    unique (tenant_id, id),
    foreign key (tenant_id, site_id) references site(tenant_id, id),
    foreign key (tenant_id, hazard_source_id) references hazard_source(tenant_id, id)
);

create index idx_risk_object_site on risk_object(tenant_id, site_id);
create index idx_hazard_source_site_status on hazard_source(tenant_id, site_id, status);
create index idx_risk_assessment_site_level on risk_assessment(tenant_id, site_id, risk_level) where is_current;

insert into permission(id, code, name) values
(gen_random_uuid(),'risk:read','查看风险'),
(gen_random_uuid(),'risk:manage','维护风险'),
(gen_random_uuid(),'risk:review','审核风险');

insert into role_permission(tenant_id, role_id, permission_id)
select '10000000-0000-0000-0000-000000000001',
       '60000000-0000-0000-0000-000000000001', id
from permission where code like 'risk:%';

insert into role_permission(tenant_id, role_id, permission_id)
select '10000000-0000-0000-0000-000000000001',
       '60000000-0000-0000-0000-000000000003', id
from permission where code in ('risk:read','risk:manage','risk:review');

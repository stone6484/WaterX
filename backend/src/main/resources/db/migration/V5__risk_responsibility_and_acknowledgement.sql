create table risk_responsibility (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    site_id uuid not null,
    hazard_source_id uuid not null,
    responsibility_type varchar(20) not null check (responsibility_type in ('ORG_UNIT','POSITION','EMPLOYEE')),
    target_id uuid not null,
    duty varchar(300) not null,
    control_frequency varchar(80),
    created_at timestamptz not null default now(),
    unique (tenant_id, id),
    unique (tenant_id, hazard_source_id, responsibility_type, target_id),
    foreign key (tenant_id, site_id) references site(tenant_id, id),
    foreign key (tenant_id, hazard_source_id) references hazard_source(tenant_id, id)
);

create table risk_acknowledgement (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    site_id uuid not null,
    hazard_source_id uuid not null,
    assessment_id uuid not null,
    user_id uuid not null,
    acknowledged_at timestamptz not null default now(),
    client_source varchar(20) not null default 'H5' check (client_source in ('WEB','H5')),
    unique (tenant_id, hazard_source_id, assessment_id, user_id),
    foreign key (tenant_id, site_id) references site(tenant_id, id),
    foreign key (tenant_id, hazard_source_id) references hazard_source(tenant_id, id),
    foreign key (tenant_id, assessment_id) references risk_assessment(tenant_id, id),
    foreign key (tenant_id, user_id) references user_account(tenant_id, id)
);

create index idx_risk_responsibility_hazard on risk_responsibility(tenant_id, site_id, hazard_source_id);
create index idx_risk_ack_user on risk_acknowledgement(tenant_id, site_id, user_id, acknowledged_at);

insert into risk_responsibility(id,tenant_id,site_id,hazard_source_id,responsibility_type,target_id,duty,control_frequency) values
(gen_random_uuid(),'10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','85000000-0000-0000-0000-000000000001','ORG_UNIT','31000000-0000-0000-0000-000000000003','组织落实临边防护与巡检管控','每班'),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','85000000-0000-0000-0000-000000000001','POSITION','70000000-0000-0000-0000-000000000005','班前确认通道、护栏和救生设施','每班'),
(gen_random_uuid(),'10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','85000000-0000-0000-0000-000000000002','ORG_UNIT','31000000-0000-0000-0000-000000000002','监督加药作业风险措施落实','每周');

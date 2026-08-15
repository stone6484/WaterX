create table inspection_plan_event (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenant(id),
    site_id uuid not null,
    plan_id uuid not null,
    action varchar(30) not null check (action in ('CREATED','PAUSED','RESUMED')),
    reason varchar(500),
    operated_by uuid not null,
    operated_at timestamptz not null default now(),
    foreign key (tenant_id,site_id) references site(tenant_id,id),
    foreign key (tenant_id,plan_id) references inspection_plan(tenant_id,id),
    foreign key (tenant_id,operated_by) references user_account(tenant_id,id)
);
create index idx_inspection_plan_event on inspection_plan_event(tenant_id,plan_id,operated_at desc);

create table hazard_reminder (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenant(id),
    site_id uuid not null,
    hazard_id uuid not null,
    message varchar(500) not null,
    reminded_by uuid not null,
    reminded_at timestamptz not null default now(),
    foreign key (tenant_id,site_id) references site(tenant_id,id),
    foreign key (tenant_id,hazard_id) references safety_hazard(tenant_id,id),
    foreign key (tenant_id,reminded_by) references user_account(tenant_id,id)
);
create index idx_hazard_reminder on hazard_reminder(tenant_id,hazard_id,reminded_at desc);

create table work_permit_gas_test (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), site_id uuid not null, permit_id uuid not null,
 oxygen numeric(6,2), carbon_monoxide numeric(10,2), hydrogen_sulfide numeric(10,2), combustible_gas numeric(10,2), other_gas varchar(200),
 test_point varchar(200) not null, tested_by varchar(100) not null, tested_at timestamptz not null,
 foreign key(tenant_id,permit_id) references work_permit(tenant_id,id)
);
create table work_permit_briefing (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), site_id uuid not null, permit_id uuid not null,
 briefing_content text not null, participant_names text not null, confirmed_by uuid not null, confirmed_at timestamptz not null default now(),
 foreign key(tenant_id,permit_id) references work_permit(tenant_id,id), foreign key(tenant_id,confirmed_by) references user_account(tenant_id,id)
);
create index idx_work_permit_gas_test on work_permit_gas_test(tenant_id,permit_id,tested_at desc);

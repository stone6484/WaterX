-- No accounts, grants or pilot data are installed by this migration.
insert into permission(id,code,name) values
(gen_random_uuid(),'process:daily:execute','日数据执行'),
(gen_random_uuid(),'process:daily:manage','工艺日数据分派与独立审核'),
(gen_random_uuid(),'process:daily:read','日数据范围查询'),
(gen_random_uuid(),'process:daily:export','日数据导出') on conflict(code) do nothing;
insert into role(id,tenant_id,code,name,role_level,built_in)
select gen_random_uuid(),t.id,x.code,x.name,'SITE',true from tenant t cross join (values
('PROCESS_OPERATOR','运行工'),('PROCESS_MANAGER','工艺经理'),('PROCESS_OBSERVER','管理层日数据查询')) x(code,name)
on conflict(tenant_id,code) do nothing;
insert into role_permission(tenant_id,role_id,permission_id)
select r.tenant_id,r.id,p.id from role r join permission p on
(r.code='PROCESS_OPERATOR' and p.code='process:daily:execute') or
(r.code='PROCESS_MANAGER' and p.code in ('process:daily:manage','process:daily:export')) or
(r.code='PROCESS_OBSERVER' and p.code='process:daily:read') on conflict do nothing;

create table process_daily_line (
 id uuid primary key, tenant_id uuid not null, site_id uuid not null,
 name varchar(120) not null, status varchar(20) not null default 'ACTIVE',
 template_version integer not null default 1, template jsonb not null,
 unique(tenant_id,id), unique(tenant_id,site_id,name),
 foreign key(tenant_id,site_id) references site(tenant_id,id)
);
-- Each line grant supplements one existing SITE role scope. There is no implicit tenant/site-wide business grant.
create table process_daily_line_scope (
 scope_id uuid not null references user_role_scope(id) on delete cascade,
 line_id uuid not null references process_daily_line(id), primary key(scope_id,line_id)
);
create table process_daily_record (
 id uuid primary key, tenant_id uuid not null, site_id uuid not null, line_id uuid not null,
 business_date date not null, revision integer not null default 1,
 assignee_id uuid not null, reviewer_id uuid not null,
 state varchar(20) not null check(state in ('DRAFT','SUBMITTED','RETURNED','CONFIRMED','CANCELLED')),
 candidate integer not null default 1, confirmed_version integer not null default 0,
 template_version integer not null, template jsonb not null,
 cells jsonb not null default '{}', participants uuid[] not null default '{}',
 correction_reason text not null default '', review_note text not null default '',
 updated_at timestamptz not null default now(),
 unique(tenant_id,line_id,business_date), unique(tenant_id,id),
 foreign key(tenant_id,site_id) references site(tenant_id,id),
 foreign key(tenant_id,line_id) references process_daily_line(tenant_id,id),
 foreign key(tenant_id,assignee_id) references employee(tenant_id,id),
 foreign key(tenant_id,reviewer_id) references employee(tenant_id,id)
);
create table process_daily_version (
 record_id uuid not null references process_daily_record(id), version integer not null,
 candidate integer not null, cells jsonb not null, template jsonb not null, template_version integer not null,
 participants uuid[] not null, confirmed_by uuid not null references employee(id),
 confirmed_at timestamptz not null default now(), reason text not null,
 primary key(record_id,version)
);
create table process_daily_event (
 id bigserial primary key, record_id uuid not null references process_daily_record(id),
 revision integer not null, candidate integer not null, action varchar(30) not null,
 user_id uuid not null references user_account(id), employee_id uuid not null references employee(id),
 actor_name varchar(120) not null, note text not null, snapshot jsonb not null,
 created_at timestamptz not null default now(), unique(record_id,revision)
);
create index ix_daily_site_date on process_daily_record(tenant_id,site_id,business_date desc);

insert into permission(id,code,name) values(gen_random_uuid(),'process:parameter:maintain','日常工艺参数维护'),(gen_random_uuid(),'process:report:generate','工艺分析日报生成') on conflict(code) do nothing;
insert into role_permission(tenant_id,role_id,permission_id) select r.tenant_id,r.id,p.id from role r cross join permission p where r.code='PROCESS_MANAGER' and p.code in ('process:parameter:maintain','process:report:generate') on conflict do nothing;
create table process_parameter (
 id uuid primary key,tenant_id uuid not null,site_id uuid not null,line_id uuid not null,
 kind varchar(12) not null check(kind in ('DESIGN','TARGET')),revision integer not null default 1,
 published_version integer not null default 0,draft jsonb not null,
 foreign key(tenant_id,site_id) references site(tenant_id,id),foreign key(tenant_id,line_id) references process_daily_line(tenant_id,id)
);
create unique index uq_process_parameter on process_parameter(tenant_id,line_id,kind);
create table process_parameter_version (
 parameter_id uuid not null references process_parameter(id),version integer not null,
 content jsonb not null,published_by uuid not null references employee(id),actor_name varchar(120) not null,
 published_at timestamptz not null default now(),primary key(parameter_id,version)
);
create table process_parameter_event (
 id bigserial primary key,parameter_id uuid not null references process_parameter(id),revision integer not null,
 action varchar(20) not null,employee_id uuid not null references employee(id),actor_name varchar(120) not null,
 note text not null,content jsonb not null,created_at timestamptz not null default now(),unique(parameter_id,revision)
);
create table process_report (
 id uuid primary key,tenant_id uuid not null,site_id uuid not null,line_id uuid not null,
 record_id uuid not null references process_daily_record(id),version integer not null,status varchar(12) not null check(status in ('DRAFT','SAVED')),
 source_stamp varchar(64) not null,source jsonb not null,rows jsonb not null,rule_version varchar(120) not null,
 created_by uuid not null references employee(id),creator_name varchar(120) not null,
 created_at timestamptz not null default now(),saved_at timestamptz,note text not null,
 unique(record_id,version),foreign key(tenant_id,site_id) references site(tenant_id,id),foreign key(tenant_id,line_id) references process_daily_line(tenant_id,id)
);

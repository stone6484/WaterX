create table inspection_plan (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenant(id),
    site_id uuid not null,
    template_id uuid not null,
    code varchar(64) not null,
    name varchar(200) not null,
    schedule_type varchar(20) not null check (schedule_type in ('DAILY','WEEKLY','MONTHLY','ONCE')),
    interval_value integer not null default 1 check (interval_value > 0),
    next_run_date date not null,
    due_hours integer not null default 24 check (due_hours > 0),
    assignee_employee_id uuid,
    status varchar(20) not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','COMPLETED')),
    last_generated_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(tenant_id,site_id,code), unique(tenant_id,id),
    foreign key (tenant_id,site_id) references site(tenant_id,id),
    foreign key (tenant_id,template_id) references inspection_template(tenant_id,id),
    foreign key (tenant_id,assignee_employee_id) references employee(tenant_id,id)
);

alter table inspection_task add column plan_id uuid;
alter table inspection_task add column scheduled_for date;
alter table inspection_task add foreign key (tenant_id,plan_id) references inspection_plan(tenant_id,id);
create unique index uq_inspection_task_plan_date on inspection_task(tenant_id,plan_id,scheduled_for) where plan_id is not null;
create index idx_inspection_plan_due on inspection_plan(status,next_run_date);

insert into inspection_plan(id,tenant_id,site_id,template_id,code,name,schedule_type,interval_value,next_run_date,due_hours,assignee_employee_id) values
('84000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000002','PLAN-P01-DAILY-OPS','运维班组每日安全检查计划','DAILY',1,current_date,12,'41000000-0000-0000-0000-000000000004');

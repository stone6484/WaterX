create extension if not exists pgcrypto;

create table tenant (
    id uuid primary key,
    code varchar(64) not null unique,
    name varchar(200) not null,
    status varchar(20) not null check (status in ('ACTIVE','DISABLED')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table company (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    parent_id uuid null,
    code varchar(64) not null,
    name varchar(200) not null,
    company_type varchar(30) not null check (company_type in ('GROUP','REGION','OPERATING_COMPANY')),
    status varchar(20) not null default 'ACTIVE',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, code),
    unique (tenant_id, id),
    foreign key (tenant_id, parent_id) references company(tenant_id, id)
);

create table site (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    company_id uuid not null,
    code varchar(64) not null,
    name varchar(200) not null,
    time_zone varchar(64) not null default 'Asia/Shanghai',
    status varchar(20) not null default 'ACTIVE',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, code),
    unique (tenant_id, id),
    foreign key (tenant_id, company_id) references company(tenant_id, id)
);

create table org_unit (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    site_id uuid not null,
    parent_id uuid null,
    code varchar(64) not null,
    name varchar(200) not null,
    unit_type varchar(30) not null check (unit_type in ('PLANT','DEPARTMENT','TEAM')),
    sort_order integer not null default 0,
    status varchar(20) not null default 'ACTIVE',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, site_id, code),
    unique (tenant_id, id),
    foreign key (tenant_id, site_id) references site(tenant_id, id),
    foreign key (tenant_id, parent_id) references org_unit(tenant_id, id)
);

create table position (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    code varchar(64) not null,
    name varchar(120) not null,
    status varchar(20) not null default 'ACTIVE',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, code),
    unique (tenant_id, id)
);

create table employee (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    site_id uuid null,
    employee_no varchar(64) not null,
    display_name varchar(120) not null,
    mobile varchar(32),
    email varchar(200),
    status varchar(20) not null check (status in ('ACTIVE','INACTIVE','LEFT')),
    joined_on date,
    left_on date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, employee_no),
    unique (tenant_id, id),
    foreign key (tenant_id, site_id) references site(tenant_id, id)
);

create table employee_position (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    employee_id uuid not null,
    org_unit_id uuid not null,
    position_id uuid not null,
    is_primary boolean not null default false,
    start_date date not null,
    end_date date,
    created_at timestamptz not null default now(),
    foreign key (tenant_id, employee_id) references employee(tenant_id, id),
    foreign key (tenant_id, org_unit_id) references org_unit(tenant_id, id),
    foreign key (tenant_id, position_id) references position(tenant_id, id)
);

create unique index uq_employee_primary_position
    on employee_position(tenant_id, employee_id) where is_primary and end_date is null;

create table user_account (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    employee_id uuid not null,
    username varchar(100) not null,
    password_hash varchar(100) not null,
    status varchar(20) not null check (status in ('ACTIVE','LOCKED','DISABLED')),
    must_change_password boolean not null default true,
    password_changed_at timestamptz,
    last_login_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (tenant_id, username),
    unique (tenant_id, id),
    foreign key (tenant_id, employee_id) references employee(tenant_id, id)
);

create unique index uq_user_username_case_insensitive on user_account(lower(username));

create table role (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    code varchar(64) not null,
    name varchar(120) not null,
    role_level varchar(20) not null check (role_level in ('PLATFORM','REGION','SITE','DEPARTMENT','TEAM','PERSONAL')),
    built_in boolean not null default false,
    status varchar(20) not null default 'ACTIVE',
    created_at timestamptz not null default now(),
    unique (tenant_id, code),
    unique (tenant_id, id)
);

create table permission (
    id uuid primary key,
    code varchar(100) not null unique,
    name varchar(160) not null
);

create table role_permission (
    tenant_id uuid not null references tenant(id),
    role_id uuid not null,
    permission_id uuid not null references permission(id),
    primary key (tenant_id, role_id, permission_id),
    foreign key (tenant_id, role_id) references role(tenant_id, id)
);

create table user_role_scope (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    user_id uuid not null,
    role_id uuid not null,
    scope_type varchar(20) not null check (scope_type in ('TENANT','COMPANY','REGION','SITE','ORG_UNIT','SELF')),
    scope_id uuid not null,
    valid_from timestamptz not null default now(),
    valid_until timestamptz,
    created_at timestamptz not null default now(),
    unique (tenant_id, user_id, role_id, scope_type, scope_id),
    foreign key (tenant_id, user_id) references user_account(tenant_id, id),
    foreign key (tenant_id, role_id) references role(tenant_id, id)
);

create table auth_session (
    id uuid primary key,
    tenant_id uuid not null references tenant(id),
    user_id uuid not null,
    access_token_hash char(64) not null unique,
    refresh_token_hash char(64) not null unique,
    access_expires_at timestamptz not null,
    refresh_expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    revoked_at timestamptz,
    foreign key (tenant_id, user_id) references user_account(tenant_id, id)
);

create index idx_auth_session_user on auth_session(tenant_id, user_id);
create index idx_org_unit_site on org_unit(tenant_id, site_id);
create index idx_employee_site on employee(tenant_id, site_id);

create table audit_log (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenant(id),
    site_id uuid,
    actor_user_id uuid,
    action varchar(100) not null,
    object_type varchar(100) not null,
    object_id uuid,
    detail jsonb not null default '{}'::jsonb,
    occurred_at timestamptz not null default now()
);

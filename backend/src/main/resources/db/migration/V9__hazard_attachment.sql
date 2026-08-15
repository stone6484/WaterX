create table safety_attachment (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references tenant(id),
    site_id uuid not null,
    object_type varchar(30) not null check (object_type in ('SAFETY_HAZARD')),
    object_id uuid not null,
    business_stage varchar(30) not null check (business_stage in ('DISCOVERY','RECTIFICATION','REVIEW')),
    original_name varchar(240) not null,
    storage_key varchar(300) not null,
    content_type varchar(120) not null,
    file_size bigint not null check (file_size > 0),
    uploaded_by uuid,
    uploaded_at timestamptz not null default now(),
    unique(tenant_id,id), unique(storage_key),
    foreign key (tenant_id,site_id) references site(tenant_id,id),
    foreign key (tenant_id,object_id) references safety_hazard(tenant_id,id),
    foreign key (tenant_id,uploaded_by) references user_account(tenant_id,id)
);

create index idx_safety_attachment_object on safety_attachment(tenant_id,site_id,object_type,object_id,uploaded_at);

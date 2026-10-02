-- Additive asset tables only. No changes to accounts, grants or existing production formulas.
create table model_asset (
 id uuid primary key, tenant_id uuid not null, site_id uuid not null,
 revision integer not null default 1, published_version integer not null default 0,
 retired boolean not null default false, draft jsonb not null,
 created_by uuid not null references user_account(id), updated_at timestamptz not null default now(),
 foreign key(tenant_id,site_id) references site(tenant_id,id)
);
create index ix_model_asset_site on model_asset(tenant_id,site_id);
create table model_version (
 model_id uuid not null references model_asset(id), version integer not null,
 content jsonb not null, tests jsonb not null, published_by uuid not null references user_account(id),
 published_at timestamptz not null default now(), engine_version varchar(40) not null,
 primary key(model_id,version)
);
create table model_trial (
 id uuid primary key, model_id uuid not null references model_asset(id) on delete cascade,
 revision integer not null, inputs jsonb not null, expected jsonb not null, result jsonb not null,
 passed boolean not null, evidence text not null, created_by uuid not null references user_account(id),
 created_at timestamptz not null default now()
);
create table model_material (
 id uuid primary key, model_id uuid not null references model_asset(id) on delete cascade,
 name varchar(180) not null, mime varchar(120) not null, size integer not null check(size between 1 and 5242880),
 sha256 varchar(64) not null, data bytea not null, created_at timestamptz not null default now()
);
create table model_event (
 id bigserial primary key, model_id uuid not null, tenant_id uuid not null, site_id uuid not null,
 action varchar(40) not null, revision integer not null, actor_name varchar(120) not null,
 detail jsonb not null, created_at timestamptz not null default now()
);
create table model_result (
 id uuid primary key, model_id uuid not null, version integer not null, fingerprint varchar(64) not null,
 context jsonb not null, inputs jsonb not null, outputs jsonb not null, engine_version varchar(40) not null,
 created_by uuid not null references user_account(id), created_at timestamptz not null default now(),
 unique(model_id,version,fingerprint), foreign key(model_id,version) references model_version(model_id,version)
);
create table model_selection (
 model_id uuid primary key, version integer not null, selected_at timestamptz not null default now(),
 foreign key(model_id,version) references model_version(model_id,version)
);

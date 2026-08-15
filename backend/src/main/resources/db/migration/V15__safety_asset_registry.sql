create table safety_asset (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), site_id uuid not null,
 asset_no varchar(80) not null, asset_name varchar(200) not null, asset_type varchar(40) not null, category varchar(100),
 location varchar(200) not null, responsible_person varchar(100), manufacturer varchar(200), model_spec varchar(200),
 registration_no varchar(100), quantity numeric(12,2) not null default 1, unit varchar(30) not null default '台',
 commissioned_on date, last_inspected_on date, next_inspection_on date, expires_on date,
 reminder_days integer not null default 30, status varchar(20) not null default 'IN_SERVICE', notes text, created_at timestamptz not null default now(),
 unique(tenant_id,asset_no), unique(tenant_id,id), foreign key(tenant_id,site_id) references site(tenant_id,id)
);
create table safety_asset_maintenance (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenant(id), site_id uuid not null, asset_id uuid not null,
 maintenance_type varchar(30) not null, performed_on date not null, performed_by varchar(200) not null,
 result varchar(30) not null, description text not null, next_due_on date, cost numeric(14,2) not null default 0, created_at timestamptz not null default now(),
 foreign key(tenant_id,site_id) references site(tenant_id,id), foreign key(tenant_id,asset_id) references safety_asset(tenant_id,id)
);
create index idx_safety_asset_due on safety_asset(tenant_id,site_id,next_inspection_on,expires_on);
create index idx_asset_maintenance on safety_asset_maintenance(tenant_id,asset_id,performed_on desc);

insert into safety_asset(id,tenant_id,site_id,asset_no,asset_name,asset_type,category,location,responsible_person,manufacturer,model_spec,registration_no,commissioned_on,last_inspected_on,next_inspection_on,reminder_days) values
('89000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','TS-QZ-001','污泥脱水间电动葫芦','SPECIAL_EQUIPMENT','起重机械','污泥脱水机房','设备主管（示例）','示例制造商','CD1-3T','TS-DEMO-001',current_date-interval '900 day',current_date-interval '340 day',current_date+interval '25 day',30),
('89000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','AQ-FJ-001','储气罐安全阀','SAFETY_ACCESSORY','安全阀','鼓风机房','运维班长（示例）','示例制造商','A48Y','FJ-DEMO-001',current_date-interval '700 day',current_date-interval '180 day',current_date+interval '160 day',30);
insert into safety_asset(tenant_id,site_id,asset_no,asset_name,asset_type,category,location,responsible_person,model_spec,quantity,unit,expires_on,reminder_days) values
('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','XF-MHQ-001','干粉灭火器','FIRE_EQUIPMENT','灭火器','配电室','安全员（示例）','MFZ/ABC4',6,'具',current_date+interval '20 day',30),
('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','YJ-ZJH-001','正压式空气呼吸器','EMERGENCY_SUPPLY','呼吸防护','应急物资库','安全员（示例）','RHZK6.8',2,'套',current_date+interval '240 day',60),
('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','YJ-SJD-001','便携式四合一气体检测仪','EMERGENCY_SUPPLY','检测仪器','中控室','安全员（示例）','4-IN-1',2,'台',current_date+interval '80 day',30);

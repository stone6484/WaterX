create table training_material (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenant(id),site_id uuid,course_id uuid not null,
 original_name varchar(255) not null,storage_key varchar(600) not null,content_type varchar(150) not null,file_size bigint not null,
 uploaded_by uuid not null,uploaded_at timestamptz not null default now(),
 foreign key(tenant_id,course_id) references safety_training_course(tenant_id,id),foreign key(tenant_id,uploaded_by) references user_account(tenant_id,id)
);
create table safety_commitment_template (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenant(id),site_id uuid,
 code varchar(50) not null,name varchar(200) not null,position_scope varchar(300) not null,content text not null,version varchar(30) not null,status varchar(20) not null default 'ACTIVE',created_at timestamptz not null default now(),
 unique(tenant_id,code,version),unique(tenant_id,id)
);
create table safety_commitment_assignment (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenant(id),site_id uuid not null,template_id uuid not null,employee_id uuid not null,
 assigned_at timestamptz not null default now(),due_at timestamptz not null,status varchar(20) not null default 'PENDING',signed_at timestamptz,signer_user_id uuid,signature_text varchar(200),
 foreign key(tenant_id,template_id) references safety_commitment_template(tenant_id,id),foreign key(tenant_id,employee_id) references employee(tenant_id,id),foreign key(tenant_id,signer_user_id) references user_account(tenant_id,id)
);
create table visitor_safety_briefing (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenant(id),site_id uuid not null,access_token varchar(80) not null,
 title varchar(200) not null,briefing_content text not null,risk_map_description text,evacuation_description text,emergency_contact varchar(200),status varchar(20) not null default 'ACTIVE',created_at timestamptz not null default now(),
 unique(access_token),unique(tenant_id,site_id),unique(tenant_id,id)
);
create table visitor_entry_record (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references tenant(id),site_id uuid not null,briefing_id uuid not null,
 visitor_name varchar(100) not null,mobile varchar(40),company_name varchar(200),visit_purpose varchar(300) not null,host_name varchar(100) not null,
 acknowledged boolean not null,registered_at timestamptz not null default now(),entry_status varchar(20) not null default 'REGISTERED',
 foreign key(tenant_id,site_id) references site(tenant_id,id),foreign key(tenant_id,briefing_id) references visitor_safety_briefing(tenant_id,id)
);

insert into safety_commitment_template(id,tenant_id,code,name,position_scope,content,version) values
('92000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','COMMIT-ALL','岗位安全生产承诺书','全体从业人员','本人承诺遵守安全生产法律法规和本单位规章制度，履行岗位安全职责；主动辨识作业风险，落实安全措施和劳动防护要求；不违章指挥、不违章作业、不违反劳动纪律；发现事故隐患立即报告并采取力所能及的临时措施；熟悉应急处置和疏散要求，发生险情时服从统一指挥。','2026-V1');
insert into safety_commitment_assignment(tenant_id,site_id,template_id,employee_id,due_at) values
('10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','92000000-0000-0000-0000-000000000001','41000000-0000-0000-0000-000000000005',now()+interval '15 day');
insert into visitor_safety_briefing(id,tenant_id,site_id,access_token,title,briefing_content,risk_map_description,evacuation_description,emergency_contact) values
('93000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','VISITOR-DEMO-PLANT-01','第一污水处理厂访客安全告知','进入生产区域须由接待人员陪同；禁止擅自触碰设备、阀门和电气设施；禁止进入有限空间、配电室、加药间等受限区域；按要求佩戴安全帽等防护用品；遇到报警立即停止活动并按疏散指示撤离。','重点风险区域包括提升泵房、加药间、鼓风机房、配电室和污泥处理区域。','听到应急广播后沿现场绿色疏散标识撤离至厂区主入口应急集合点，禁止乘坐电梯或逆向返回。','中控室：厂内短号 100；紧急情况拨打 119/120'),
('93000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','VISITOR-DEMO-PLANT-02','第二污水处理厂访客安全告知','进入生产区域须由接待人员陪同，遵守现场标识和人员指引，不得擅自操作设备或进入受限区域。','重点风险区域包括提升泵房、加药间、配电室和污泥处理区域。','遇到报警沿绿色疏散标识撤离至厂区主入口集合点。','紧急情况拨打 119/120');

alter table risk_assessment
    add column approval_status varchar(20) not null default 'APPROVED'
        check (approval_status in ('DRAFT','PENDING_REVIEW','APPROVED','RETURNED')),
    add column assessment_reason varchar(300),
    add column review_comment varchar(500),
    add column reviewed_by uuid,
    add column reviewed_at timestamptz;

alter table risk_assessment
    add foreign key (tenant_id, reviewed_by) references user_account(tenant_id, id);

create unique index uq_pending_risk_reassessment
    on risk_assessment(tenant_id, hazard_source_id)
    where approval_status='PENDING_REVIEW';

create index idx_risk_assessment_history
    on risk_assessment(tenant_id, site_id, hazard_source_id, assessed_at desc);

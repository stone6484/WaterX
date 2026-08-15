insert into safety_hazard(id,tenant_id,site_id,hazard_no,source_type,location,name,category_major,category_minor,
  description,hazard_level,rectification_measure,temporary_measure,due_date,estimated_cost,responsible_org_id,responsible_employee_id,status)
values('83000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',
  'YH-P01-OVERDUE-01','EMPLOYEE_REPORT','污泥脱水机房','防护栏杆局部松动','设备设施及物料类','安全防护设施类',
  '脱水机检修平台防护栏杆连接螺栓松动，存在人员坠落风险','SERIOUS','更换连接螺栓并对栏杆整体紧固验收',
  '设置警戒带并暂停使用该检修平台',current_date-9,1200,'31000000-0000-0000-0000-000000000006',
  '41000000-0000-0000-0000-000000000004','OVERDUE');

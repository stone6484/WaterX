# Sprint 3 检查与隐患闭环交付说明

## 本轮已实现

- 多厂隔离的检查模板、模板检查项、检查任务、逐项结果和隐患台账数据模型。
- 检查结果支持符合、不符合、不适用三种结论，为后续现场逐项执行预留结构。
- 内置重点部位、运维班组日检和节假日专项检查示例模板，内容从用户提供的原始表单中提炼，未使用任何原集团名称或标识。
- 隐患字段覆盖位置、名称、大小类、情况说明、级别、整改措施、临时措施、完成时限、预计金额、责任部门、责任人员、整改反馈和验收意见。
- 隐患状态支持待整改、整改中、待验收、已闭环和已逾期。
- 管理端新增检查任务看板、检查模板库、隐患台账、提交整改、验收通过和退回整改。
- 手机 H5 新增现场隐患上报和整改反馈入口。
- 管理端可创建每日、每周、每月和一次性检查计划，设置首次生成日期、周期间隔、完成时限和执行人员。
- 后台每小时扫描到期计划并自动生成检查任务，以“计划 + 计划日期”唯一约束防止重复派发。
- 支持人工点击“立即生成”，便于补发或验证当日到期任务。
- 示例厂区预置检查任务与不同状态的隐患，可直接演示闭环。
- 手机端可在隐患上报时上传现场照片或文件，在整改反馈时上传整改照片与凭证；上传失败不会把隐患误推进到待验收。
- 附件按厂区、隐患和发现/整改/验收阶段隔离存储，管理端隐患台账汇总显示文件名称和阶段。
- 单文件上限 10MB，仅允许图片、PDF、Word 和 Excel；服务端提供受权限保护的附件查询与下载接口。
- 周期检查计划支持暂停、恢复及原因留痕，暂停期间不会继续生成任务。
- 检查任务和未整改隐患按完成期限自动标记逾期，隐患台账支持发起催办并展示累计次数与最近催办时间。
- 隐患逾期采用三级升级规则：1–3 天一般提醒、4–7 天部门督办、8 天以上厂级升级。
- 管理端统计看板展示隐患闭环率、级别分布、发现来源及逾期升级分布，并预置一条厂级升级示例数据用于演示。

## 主要接口

- `GET /api/v1/safety/inspection/summary`
- `GET /api/v1/safety/inspection/templates`
- `GET /api/v1/safety/inspection/templates/{id}/items`
- `GET /api/v1/safety/inspection/tasks`
- `GET /api/v1/safety/hazards`
- `POST /api/v1/safety/hazards`
- `POST /api/v1/safety/hazards/{id}/rectification`
- `POST /api/v1/safety/hazards/{id}/review`
- `GET /api/v1/safety/hazards/{id}/attachments`
- `POST /api/v1/safety/hazards/{id}/attachments?stage=DISCOVERY|RECTIFICATION|REVIEW`
- `GET /api/v1/safety/hazards/{id}/attachments/{attachmentId}/download`
- `POST /api/v1/safety/inspection/plans/{id}/status`
- `POST /api/v1/safety/hazards/{id}/reminders`
- `GET /api/v1/safety/inspection/statistics`

## 下一小步

1. 进入危险作业审批模块。
2. 正式部署时将本地附件存储切换为 MinIO 对象存储。

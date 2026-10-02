# 数字孪生模块交接（2026-10-02）

本模块在第一阶段93167bd主产品基础上，整合已确认的accepted-20261002细化快照。新增道路并集、路缘、服务通道、构筑物和管线细化、现场人员图标；保持原主产品贴边布局、独立图标和Vue卸载清理。

- 入口：`DigitalTwinPage.vue` → `runtime.js`；场景内容：`scene.html`、`case-data.json`；纹理由 `scene-surfaces.js` 的Vite资产引用打包。
- 设施/设备/人员详情各在对应模块；人员示例任务使用项目/用户隔离的浏览器存储，不接真实派单、消息或生产控制。
- 路网在 `site-geometry.js` 与 `site-routing.js`，模拟信号沿用既有模拟模块；数据缺失、正常和风险场景不得混同。
- 卸载时释放事件、动画、观察器、Three图形资源与纹理缓存。切换菜单不应重复积累渲染循环。
- 不含天气功能；没有“一键回正”；来源链接是主站 `/digital-twin/scenario.html`。
- 测试：`personnel.test.mjs`、`refinement.test.mjs`、既有模拟验证；全产品验收及发布事实见根HANDOFF与 `docs/ui/verification-20261002-integration.md`。

仍为可运行高保真原型。设施、信号、风险和人员均需后续逐项工程化，不能据此宣称真实采集、算法诊断或设备闭环已完成。

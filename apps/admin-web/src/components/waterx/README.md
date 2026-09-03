# WaterX UI 工程基线 1.0

本目录承接已经确认的 Foundations、Components 与 Page Patterns。新页面优先复用这里的组件和 `design-tokens.css`，不要在业务模块中复制一套近似样式。

## 已提供组件

| 组件 | 用途 |
|---|---|
| `WxButton` | Primary、Secondary、Ghost、Danger 按钮，含 disabled/loading 状态 |
| `WxField` | 筛选或表单字段的标签、控件、辅助文字结构 |
| `WxInput` / `WxSelect` | 统一输入与选择控件 |
| `WxStatusSummary` | 页面唯一的正常、预警、告警汇总 |
| `WxCard` | 首页 KPI、图表和必要业务卡片 |
| `WxTableSurface` | 常规表格的单一外层边界与 20px 留白 |
| `WxTable` | 无左右竖线、1px 横向分隔线的数据表格 |
| `WxTabs` | 普通页签或表格附着页签的语义容器 |
| `WxTag` | 中性、正常、预警、告警文字标签 |
| `WxState` | loading、empty、error、forbidden 页面状态 |

## 使用约束

- 颜色、间距、圆角、边框、阴影和密度必须引用 `design-tokens.css`。
- 页面先选择 Pattern：运营工作台、数据诊断、指标评价、主从详情或业务编辑。
- 筛选栏默认扁平；Button 紧跟筛选字段；页面状态汇总位于右侧且只出现一次。
- 表格内容能容纳时按业务比例均衡铺满；只有内容无法安全容纳时才启用局部横向滚动。
- 表头上下线、表体行线和末行底线统一为 1px Neutral 100。
- 实际值加粗；状态必须有文字，不能只依赖颜色。
- 常规页面至少检查 1280px 紧凑窗口和 1440px 常用工作窗口；不得出现页面级横向滚动或内容遮挡。
- 新功能不得修改这些组件来满足单一页面的特殊布局；应使用业务 class 做有限变体，并说明原因。

## 当前迁移范围

- 首页工作台：Button、Card、Tabs 与基础 Token。
- 工艺诊断分析：Field、Input、Select、Button、Status Summary、Table Surface、Tabs、Table。
- 管理质量四维（含经济高效）：Table Surface、Table 与评价表格基线。
- 全局错误提示：State。

其余模块按 MVP 业务优先级渐进迁移，不进行一次性全站重写。

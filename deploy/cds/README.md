# WaterX CDS 预构建部署

目标项目固定为 `https://geole.me` / `505739583b45`，仓库为 `stone6484/WaterX`。
不得把同名设计资料目录或其他 CDS 项目当作目标。

## 发布合同

- `.github/workflows/branch-image.yml` 的名称必须为 `Branch Image`，供 CDS 识别成功事件。
- 管理端、手机端、后端每次共同构建并验证；全部通过后才推送三个镜像。
- 镜像使用完整提交 SHA 标签，不使用 `latest` 或分支标签回退。合并提交必须单独完成镜像构建。
- `cds-compose.yml` 的基础配置和 express 模式均为预构建；CDS 只拉镜像并启动，不运行 Node/Maven 编译。
- 管理端 `/`、手机端 `/h5/` 是用户入口；后端 `/api/`、`/partner/`、`/open/` 是业务路由。
- `/actuator/health` 只用于内部就绪检查，不作为公开入口或公开路由。
- 前端镜像含 `build-info.json`，用于核对提交及入口资源哈希；后端镜像内 `/app/build-commit.txt` 和 OCI revision 标签用于核对提交。

## 数据与凭据

保留 `postgres` 服务、PostgreSQL 16、`waterx_postgres` 与 `waterx_uploads` 卷名和原挂载目录。
仓库仅声明环境变量名；连接串、数据库密码及已有账号数据继续由 CDS 管理，禁止写入镜像、提交、PR 或交接文档。
CDS 的 `CDS_DATABASE_URL` 为通用 PostgreSQL URI。镜像启动脚本将其转换为 JDBC 地址，移除 URL 内的凭据，继续使用独立的用户名/密码变量；已有 JDBC 地址保持不变。不修改 CDS 变量值或数据库，CI 使用同类 URI 验证真实启动。
配置导入不代表迁移后的真实数据库和附件已经恢复。发布前核实持久卷及数据来源；不得用新空库、重置账号或清空卷掩盖迁移缺失。

GHCR 新包默认可能为私有。推送成功不等于 CDS 可以拉取：必须验证拉取权限。不要为了绕过私有镜像权限回退 CDS 源码编译；未经用户确认，不扩大包的公开可见性或权限范围。

## 检查与审批顺序

1. 项目级 `.agents/skills` 安装 CDS 完整技能包，校验版本、授权与项目归属；工具及凭据留本地并忽略。
2. 读取 CDS 当前配置，执行配置漂移扫描。旧迁移项目无仓库配置时，须明确记录漂移扫描跳过，不声称“无漂移”。
3. 修改合同后执行 `cdscli verify .`，必须包含服务端校验；由 `cdscli import` 提交页面审批，不自行批准。
4. 回读三个 profile 的 `prebuiltImage` 和 `prebuiltModes`，再推送发布分支、创建 PR 并按检查结果合并。
5. 等待目标提交 `Branch Image` 成功，核对三个镜像的版本及可拉取性。仅此后部署 CDS。
6. 从 CDS API 获取所有真实预览入口；验证 HTML、其引用的 JS/CSS、API、实际浏览器登录。CDS running 不等于产品验收通过。

## 验证工具

- `verify-static.mjs <dist> </base/> <完整SHA>`：阻止空页面、资源缺失/越界、错误路径前缀；写入构建清单。
- `verify-static.test.mjs`：10 项正反例；中文本地目录也适用。
- `verify-surface.mjs <URL> <完整SHA>`：CI 中直接检查 nginx 镜像入口、MIME、资源哈希和错误路由。它检查的是镜像自身，不可直接当作 CDS 网关验收命令。
- `verify-backend.mjs <本机URL>`：CI 中连接独立临时 PostgreSQL 的后端运行镜像，检查 health 和版本接口；限制为本机地址，不能对线上数据库执行初始化。

本机无 Docker 时，本地两端构建与后端测试只能证明源码/产物正确；镜像构建、nginx 行为和 Linux 运行验证以 GitHub Actions 实际结果为准。

## 回退边界

保留本轮前的 GitHub 提交及 CDS 配置版本作为对照。预构建模式下仅可选择已验证且三个镜像齐全的提交；首次改造前的提交没有预构建镜像，不能假设可直接回退。数据库或附件恢复需要单独明确授权，不能跟随代码回退自动执行。

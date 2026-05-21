# ParentMarry MVP

放在 `/Users/leo/Desktop/worthmatch/product_lab/parent-marry-mvp` 下的父母端相亲推荐 MVP。当前版本先把完整链路跑通：

```text
登录 -> 建档 -> AI 整理 -> 资料页确认 -> 今日推荐 -> 喜欢/收藏/跳过 -> 双向匹配 -> 后台查看
```

## 项目结构

```text
services/api           FastAPI 后端，内存数据 + mock AI + 规则推荐
apps/user-app          面向父母的移动端 H5，按小程序流程组织
apps/admin-dashboard   内部管理后台，用于查看资料、AI 输出、推荐和行为
```

## 本地运行

后端：

```bash
cd /Users/leo/Desktop/worthmatch/product_lab/parent-marry-mvp/services/api
uv venv
uv pip install -r requirements.txt
uv run uvicorn app.main:app --reload --port 8000
```

前端依赖：

```bash
cd /Users/leo/Desktop/worthmatch/product_lab/parent-marry-mvp
npm install
```

用户端：

```bash
npm run dev:user
```

后台：

```bash
npm run dev:admin
```

默认地址：

- 用户端：`http://localhost:5173`
- 管理后台：`http://localhost:3001`
- 后端接口文档：`http://localhost:8000/docs`

## GitHub Pages 演示版

GitHub Pages 只能托管静态页面，不能运行 FastAPI 后端。仓库里已加入 `VITE_STATIC_DEMO=true` 演示模式，构建时会直接使用前端内置的 8 份模拟资料和 AI 生成照片。

部署方式：

```bash
VITE_STATIC_DEMO=true npm run build:user
```

推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会自动构建并发布 `apps/user-app/dist` 到 GitHub Pages。演示入口默认手机号是 `13900000005`。

## 当前实现边界

- AI 使用 mock provider，接口边界已独立成 `AIService`。
- 推荐使用硬过滤 + 规则打分 + AI 推荐理由。
- 数据先放在内存中，模型字段按 PostgreSQL 落表方向设计。
- 图片上传先返回 mock URL，预留 COS/OSS 替换点。
- 不包含支付、真实聊天、身份认证、真人红娘后台和复杂社群功能。

## 参考说明

- [审美工具与使用路径](docs/aesthetic-tooling-reference.md)：沉淀 Vibe Coding 审美工具、MCP/CLI 可用性、Kimi WebBridge/OpenCLI 使用方式和 ParentMarry 当前视觉基线。

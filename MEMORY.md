# Project Memory Index

> 项目的"工作记忆"：记录架构决策、踩过的坑、隐性约定、外部集成细节。
>
> 每个任务完成后由 Claude 追加。读 memory 是 SDD 工作流 Phase A 的强制步骤。

---

## 索引格式

每条目：`- [<标题>](memory/<category>/<file>.md) — <一句话摘要> · 来源 T-x.x.x`

---

## Decisions（架构决策）

> 在 ≥2 个合理方案中做了非显而易见的取舍。

- [单用户白名单鉴权](memory/decisions/single-user-whitelist-auth.md) — 选择 `x-user-phone` 明文头 + `ALLOWED_PHONE` 环境变量而非 JWT/Session/OAuth · 来源 项目初始化
- [客户端直传 Vercel Blob 绕过 Functions 4.5MB 限制](memory/decisions/client-direct-upload-vercel-blob.md) — 三步上传流程（签发 token → 客户端直传 → 写元数据）· 来源 项目初始化
- [pnpm 作为唯一包管理器](memory/decisions/pnpm-as-package-manager.md) — 磁盘效率优于 npm，严格依赖解析减少幽灵依赖 · 来源 engineering-cleanup
- [PWA 场景下用 JS 强制禁止缩放](memory/decisions/pwa-js-zoom-prevention.md) — iOS Safari PWA 模式无视 viewport meta，JS 层阻止是唯一方案 · 来源 设计决策

## Pitfalls（踩过的坑）

> 第三方库/系统的非显而易见行为。

- [Upstash Redis REST API 自动反序列化 JSON](memory/pitfalls/upstash-redis-auto-deserialize.md) — `readUser()` 须用 `typeof raw === 'string'` 防御性判断兼容两种行为 · 来源 项目初始化
- [Vercel Blob onUploadCompleted 本地开发无法触发](memory/pitfalls/vercel-blob-onuploadcompleted-local-dev.md) — 客户端必须显式调用 create-media，不能依赖服务端回调 · 来源 项目初始化
- [JS 手势阻止缩放是 PWA 的无奈之举](memory/pitfalls/pwa-js-gesture-zoom-prevention.md) — 违反 WCAG 但无更好替代方案，不要移除这些 JS 代码 · 来源 用户体验讨论
- [Tailscale Serve 与 Next.js Dev Server 端口冲突](memory/pitfalls/tailscale-nextjs-port-conflict.md) — Next.js 默认监听 `::` 全接口，需 `-H 127.0.0.1` 避免 EADDRINUSE · 来源 T-2.1.2
- [Playwright route.continue() 跳过后续 handler](memory/pitfalls/playwright-route-continue-vs-fallback.md) — mock 辅助函数中应用 `route.fallback()` 而非 `route.continue()` · 来源 T-5.2.2

## Conventions（隐性约定）

> 项目内跨任务共享的约定，不属于 lint 规则覆盖范围。

- [CSS 体系](memory/conventions/css-architecture.md) — 纯 CSS + HSL 变量，BEM 风格前缀（`.auth-`、`.record-`、`.toast-` 等），不使用 Tailwind · 来源 项目初始化
- [组件与 hooks 目录](memory/conventions/component-hooks-directory.md) — `src/app/components/`、`src/app/hooks/`、`src/app/utils/` 三分法 · 来源 engineering-cleanup
- [API 错误响应格式](memory/conventions/api-error-response-format.md) — 统一 `{ error: string }` JSON，中文错误信息，状态码 400/401/403/404/429/500 · 来源 engineering-cleanup
- [TypeScript 路径别名](memory/conventions/typescript-path-alias.md) — `@/*` 映射到 `./src/*`，避免深层相对路径 · 来源 项目初始化

## Integrations（外部集成笔记）

> 与外部系统集成的细节。

- [Upstash Redis](memory/integrations/upstash-redis.md) — `Redis.fromEnv()` 连接，key `user:{phone}`，TTL 7 天，上限 100 条 · 来源 项目初始化
- [Vercel Blob](memory/integrations/vercel-blob.md) — 客户端直传，路径 `clipboard/{phone}/{id}/{file}`，缩略图 `?w=200` · 来源 项目初始化
- [Vercel Cron](memory/integrations/vercel-cron.md) — 每日 03:00 UTC 兜底清理过期 blob，`CRON_SECRET` Bearer token 鉴权 · 来源 项目初始化
- [Tailscale Serve 暴露开发服务器](memory/integrations/tailscale-dev-server.md) — `tailscale serve --bg --https=3000 3000` + `next dev -H 127.0.0.1` · 来源 T-1.2.3, T-2.1.2

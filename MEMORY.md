# Project Memory Index — 最近 20 条新增

> 索引格式：`- [<file-stem>](<cat>/<file>.md) — T-x.x.x` （每行 ≤ 80 字符）
> 全量索引见 `memory/.index.md`（按 category 分组，懒读）。
> Phase A 强制读：仅本文件 + 关键词命中文件。

## 最近新增（FIFO 滚动窗口，最多 20 条）

- [playwright-route-fallback](pitfalls/playwright-route-fallback.md) — T-5.2.2
- [tailscale-port-conflict](pitfalls/tailscale-port-conflict.md) — T-2.1.2
- [tailscale-dev-server](integrations/tailscale-dev-server.md) — T-1.2.3
- [component-hooks-dirs](conventions/component-hooks-dirs.md) — T-1.2.1
- [api-error-format](conventions/api-error-format.md) — T-1.1.3
- [pnpm-as-package-manager](decisions/pnpm-as-package-manager.md) — T-1.1.1
- [pwa-zoom-gestures](pitfalls/pwa-zoom-gestures.md) — init
- [pwa-js-zoom-prevention](decisions/pwa-js-zoom-prevention.md) — init
- [blob-direct-upload](decisions/blob-direct-upload.md) — init
- [blob-callback-localhost](pitfalls/blob-callback-localhost.md) — init
- [upstash-deserialize](pitfalls/upstash-deserialize.md) — init
- [upstash-redis](integrations/upstash-redis.md) — init
- [vercel-blob](integrations/vercel-blob.md) — init
- [vercel-cron](integrations/vercel-cron.md) — init
- [single-user-whitelist-auth](decisions/single-user-whitelist-auth.md) — init
- [typescript-path-alias](conventions/typescript-path-alias.md) — init
- [css-architecture](conventions/css-architecture.md) — init

## 写入触发条件

| 类别 | 触发 |
|------|------|
| decision | ≥2 方案非显而易见取舍 |
| pitfall | 第三方/系统非显而易见行为 |
| convention | 跨任务隐性约定 |
| integration | 外部系统版本/协议细节 |

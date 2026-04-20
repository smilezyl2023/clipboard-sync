# 剪贴板同步

一个可自部署的跨设备剪贴板同步工具，支持文本、图片、任意文件，基于 Next.js 14 + Vercel Blob + Upstash Redis 实现。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsmilezyl2023%2Fclipboard-sync&project-name=clipboard-sync&repository-name=clipboard-sync&integration-ids=oac_hb2LITYajhRQ0i4QznmKH7gx)

## ✨ 功能

- 📝 **文本同步**：跨设备共享剪贴板文字，保留 7 天
- 🖼️ **图片传输**：最大 10 MB，列表自动生成缩略图，点击查看大图，3 小时自动删除
- 📎 **文件传输**：最大 50 MB，直接下载，3 小时自动删除
- 🔒 **单用户白名单**：通过 `ALLOWED_PHONE` 环境变量限制仅自己可用
- 📥 **多入口上传**：附件按钮选择、或在输入框 `Ctrl/Cmd+V` 直接粘贴图片/文件
- 📱 **响应式 UI**：适配桌面与移动端浏览器；iOS/macOS Safari 屏蔽捏合缩放
- 🔄 **按需拉取**：打开页面或切回标签页自动同步，不做定时轮询，省 Redis 额度

## 🧱 技术栈

| 层 | 选型 | 用途 |
|---|---|---|
| 框架 | Next.js 14 (App Router) | 前端 + API Routes |
| 元数据 | Upstash Redis | 用户数据、记录索引（key: `user:{phone}`） |
| 媒体存储 | Vercel Blob | 客户端直传，绕过 Functions 4.5 MB 请求体上限 |
| 部署 | Vercel Fluid Compute | Node.js 运行时 |
| 定时任务 | Vercel Cron | 每日兜底清理过期媒体 |

## 🚀 一键部署

1. 点击上方 **Deploy with Vercel** 按钮，Fork 此仓库到你的 GitHub
2. Vercel 部署流程中选择：
   - **Storage** → 创建并连接 **Upstash Redis**（自动注入 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`，或 Vercel KV 兼容别名）
   - **Storage** → 创建并连接 **Vercel Blob**（自动注入 `BLOB_READ_WRITE_TOKEN`）
3. 在 **Settings → Environment Variables** 中添加：
   - `ALLOWED_PHONE`：你的 11 位手机号（即登录账号）
   - `CRON_SECRET`：任意随机字符串，用于保护 cron 端点（建议 `openssl rand -hex 32 | tr -d '\n'`）
4. 触发一次重新部署让环境变量生效

详细环境变量清单见 [`.env.example`](./.env.example)。

## 🔧 本地开发

```bash
pnpm install
cp .env.example .env.local        # 填入各项值，或者用 vercel env pull
pnpm dev
```

访问 http://localhost:3000，登录页输入 `ALLOWED_PHONE` 的值即可进入。

## 📁 目录结构

```
src/
├── app/
│   ├── api/
│   │   ├── auth/login/             # 手机号白名单校验
│   │   ├── records/                # GET 列表
│   │   ├── records/create/         # POST 文本
│   │   ├── records/upload/         # POST 生成 Blob 客户端直传 token
│   │   ├── records/create-media/   # POST 媒体元数据入库
│   │   ├── records/delete/         # DELETE 同步清理 Blob
│   │   └── cron/cleanup-blobs/     # GET 兜底清理过期媒体
│   ├── layout.tsx
│   └── page.tsx                    # 单页 UI
└── lib/
    ├── auth.ts                     # 白名单 & TTL 常量
    ├── redis.ts                    # Upstash client
    └── store.ts                    # 数据读写 + lazy 过期过滤
```

## ⚙️ 关键设计

- **数据模型**：`user:{phone}` 单 JSON 键存 `{ records: Record[], lastModified: number }`。Record 支持 `text | image | file` 三种类型。
- **媒体生命周期**：上传入库时写入 `expiresAt`。`getRecords` 每次访问时懒过滤过期项并异步 `del()` blob；Vercel Cron 每日兜底。
- **文本 TTL**：整条 `user:` 键 7 天无访问自动过期（`EXPIRE` 访问即刷新）。
- **客户端直传**：大文件不经过 Vercel Function，直接到 Blob；服务端仅签发 token 并在回调写元数据。

## 🛠 自定义建议

| 想做什么 | 修改 |
|---|---|
| 关闭手机号登录，换成密码 | 重写 `src/lib/auth.ts`，替换 `isAllowedPhone` |
| 允许多用户 | 把 `ALLOWED_PHONE` 换成 Redis 白名单 Set 或 OIDC；改 cron 端点遍历所有 phone |
| 替换手机号正则（非中国大陆） | 修改 `src/lib/auth.ts:2` 的 `PHONE_RE` |
| 调整文件大小 / TTL | `src/app/api/records/upload/route.ts` 和 `create-media/route.ts` 顶部常量 |
| 把图片改成私有 | Blob store 创建时选 `private`，前端用服务端代理下载 |

## ⚠️ 使用须知

- Vercel Hobby 计划仅限 **非商用个人用途**（见 [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)）。
- 当前代码以 **单用户** 为假设设计，朋友多人共用需评估 Vercel Blob Advanced Operations 配额。
- Cron 在 Hobby 下每天只能跑 1 次；主清理依赖 lazy 过滤。
- Next.js 14.2.3 存在已知安全更新建议，自部署后可按需升级到最新 14.x。

## 📝 License

[MIT](./LICENSE) © smilezyl

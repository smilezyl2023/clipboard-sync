# 剪贴板同步 · 一个公开的 SDD 实验场

一个跨设备剪贴板同步工具，**更是我用 Claude Code 实践规范驱动开发（SDD）和 agent harness engineering 的公开过程记录**。

<p align="center">
  <img src="./docs/demo.gif" alt="Clipboard Sync Demo" width="800" />
</p>

<p align="center">
  <sub>30 秒演示 · <a href="./docs/demo.mp4">下载高清 MP4</a></sub>
</p>

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsmilezyl2023%2Fclipboard-sync&project-name=clipboard-sync&repository-name=clipboard-sync&integration-ids=oac_hb2LITYajhRQ0i4QznmKH7gx)

---

## 这个仓库有两个身份

### 身份一：能用的剪贴板同步工具

- 📝 **文本同步**：跨设备共享剪贴板文字，保留 7 天
- 🖼️ **图片传输**：最大 10 MB，列表自动生成缩略图，点击查看大图，3 小时自动删除
- 📎 **文件传输**：最大 50 MB，直接下载，3 小时自动删除
- 🔒 **单用户白名单**：通过 `ALLOWED_PHONE` 环境变量限制仅自己可用
- 📥 **多入口上传**：附件按钮选择、`Ctrl/Cmd+V` 直接粘贴、拖拽上传
- 🌗 **深色模式**：跟随系统偏好或手动切换，记忆在 localStorage
- 🔍 **搜索筛选**：100 条记录中按关键词或类型（文本/图片/文件）实时过滤
- ↩️ **撤销删除**：误删 5 秒内可恢复，Toast 队列堆叠提示
- 📱 **响应式 + 离线提示**：移动端滑动删除；断网时顶部横幅；恢复联网自动消失
- ♿ **无障碍**：focus-visible 焦点轮廓 + aria-describedby 错误描述
- 🔄 **按需拉取**：打开页面或切回标签页才同步，不做定时轮询，省 Redis 额度

### 身份二：SDD + Harness Engineering 的开放实战记录

我没有把这个项目做成"提交一堆能跑的代码 + 写一份事后吹牛的 README"。整个仓库里能看到的、**我和 Claude Code 协作的全部痕迹都被刻意保留下来了**：

- 每一个功能立项前的 spec（WHY/WHAT/HOW + 验收 + 任务分解）
- 每一个任务完成后的 ≤200 字快照（文件/测试/门禁/Memory/备注，5 字段公式）
- 每一次踩坑、每一次取舍、每一个外部集成细节，沉淀进结构化的 memory 体系
- 每一个无法被自动化覆盖的视觉/真机/无障碍场景的手测清单
- 全部按"活跃工作区 vs 归档"双层组织，活跃区永远薄

如果你只想看产品，跳到下面 [🚀 一键部署](#-一键部署)。如果你和我一样在折腾"AI agent 怎么跟人协作做长周期工程"，欢迎读完这一节。

---

## 我为什么把它开源

这不是第一个剪贴板工具，市面上有十几个免费的、做得更精致的替代品。我开源它有三个原因：

**1. 我自己每天在用。**  Mac、iPhone、公司 Windows、自部署服务器，几台机器之间倒腾文字片段，用 IM 留痕，用网盘繁琐。这个工具填补了我自己的真实需求。

**2. 我想证明 SDD 不只是 toy 演示。**  网上的 spec-driven development 教程大多停在 "用 LLM 生成一段 spec"。但真问题在后面：spec 之后怎么拆任务？任务之间怎么传递上下文？踩过的坑下次怎么不再踩？已完成的工作如何归档而不让活跃区膨胀？这个项目跑了 **5 个 sprint、26 个真实任务**（工程清理 / 安全加固 / 体验增强 / 搜索深色模式 / 测试补齐），全部按一个完整的 SDD 工作流落地。整个过程的产物在仓库里 1:1 公开，**你可以审视它，也可以批评它**。

**3. 我想展示一种 harness engineering 的范式。**  我把 Claude Code 当作一个长期协作的同事，而不是一次性的代码生成器。这意味着我需要给它建一套工作环境：哪些约束它要永远遵守（`.claude/rules/`）、哪些经验要跨会话记忆（`memory/` + `MEMORY.md` 滚动窗口）、任务怎么分阶段验证（Phase A/B/C/D）、人在哪一步必须介入（手测清单 + "测试通过"暂停点）。这套 harness 不靠任何外部 SaaS，只用纯文件 + Markdown，纯文件系统操作，**仓库 clone 下来就能复现整套工作流**。

如果这三点中任何一点对你有意义，欢迎 fork 走、改自己用、或者只读不写当作研究素材。

---

## 📂 SDD 工作产物在哪里

| 路径 | 角色 | 第一次怎么读 |
|------|------|-------------|
| `.claude/rules/project-context.md` | 长期硬约束（产品定位 / 核心用户 / 业务规则 / 架构 / 历史决策） | 想理解我为什么做这些选择，从这里开始 |
| `MEMORY.md` | 滚动窗口（最近 17 条经验，每行 ≤80 字符） | 想一眼扫过项目踩坑/决策史，看这个 |
| `memory/.index.md` + `memory/{decisions,pitfalls,conventions,integrations}/` | 4 类经验全量沉淀，每条独立成文（背景/内容/影响范围/关联） | 按主题深挖时进入对应类别 |
| `specs/archive/<sprint>/<sprint>.md` | 每个 sprint 的 WHY/WHAT/HOW + 验收 + 任务清单 + 文件变更计划 | 顺时间读 5 个 sprint，看产品如何演化 |
| `specs/archive/<sprint>/<sprint>.history.md` | 每个任务的 ≤200 字完成快照（5 字段公式 + `<a id>` 锚点） | 不读源码也能扫完一个 sprint 的全部决策 |
| `PROGRESS.md` + `progress/archive/` | 任务状态进度，活跃 vs 归档严格分离 | 看项目"现在在做什么 / 过去做过什么" |
| `tests/manual/` | 自动化覆盖不到的视觉/真机/无障碍手测清单（每条标注命中"硬性条件" #1~#8） | 看哪些事即使有 44 个 e2e 仍需人来测 |

**推荐阅读路径**（第一次进来）：

1. 读 [`.claude/rules/project-context.md`](./.claude/rules/project-context.md) — 5 分钟理解立项假设
2. 读 [`MEMORY.md`](./MEMORY.md) 的滚动窗口 — 看 17 条精炼的踩坑/取舍
3. 挑一个感兴趣的 sprint，比如 [`specs/archive/security-hardening/`](./specs/archive/security-hardening/)，对照 spec 与 history 看完整迭代
4. 想自己复现整套工作流，看 spec skill 全文：[`anthropic spec skill`](https://github.com/anthropics/skills)（社区版本可能命名不同）

---

## 🧱 技术栈

| 层 | 选型 | 用途 |
|---|---|---|
| 框架 | Next.js 14 (App Router) | 前端 + API Routes |
| 元数据 | Upstash Redis | 用户数据、记录索引（key: `user:{phone}`） |
| 媒体存储 | Vercel Blob | 客户端直传，绕过 Functions 4.5 MB 请求体上限 |
| 部署 | Vercel Fluid Compute | Node.js 运行时（非 Edge） |
| 定时任务 | Vercel Cron | 每日兜底清理过期媒体 |
| 测试 | Playwright（44 e2e）+ Vitest（42 单测） | 覆盖核心业务流 |

每个选型背后的取舍都记录在 `memory/decisions/` 与 `memory/integrations/`。

---

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

---

## 🔧 本地开发

```bash
pnpm install
cp .env.example .env.local        # 填入各项值，或者用 vercel env pull
pnpm dev
```

访问 http://localhost:3000，登录页输入 `ALLOWED_PHONE` 的值即可进入。

跑测试：

```bash
pnpm test         # vitest 单测（auth.ts + store.ts）
pnpm test:e2e     # playwright e2e（44 用例）
```

---

## 📁 源码结构

```
src/
├── app/
│   ├── api/
│   │   ├── auth/login/             # 手机号白名单校验（专用限流 5 次/min）
│   │   ├── records/                # GET 列表
│   │   ├── records/create/         # POST 文本（10000 字符上限）
│   │   ├── records/upload/         # POST 生成 Blob 客户端直传 token
│   │   ├── records/create-media/   # POST 媒体元数据入库
│   │   ├── records/delete/         # DELETE 同步清理 Blob
│   │   └── cron/cleanup-blobs/     # GET 兜底清理过期媒体
│   ├── components/                 # AuthModal, RecordRow, RecordsSkeleton, SearchFilter
│   ├── hooks/                      # useRecords, useSwipe, useToastQueue, useOnlineStatus, useTheme
│   ├── utils/                      # format.ts
│   ├── layout.tsx
│   └── page.tsx                    # 单页 UI（< 400 行）
└── lib/
    ├── auth.ts                     # 白名单 & TTL 常量
    ├── rate-limit.ts               # 内存滑动窗口限流
    ├── redis.ts                    # Upstash client
    └── store.ts                    # 数据读写 + lazy 过期过滤
```

---

## ⚙️ 关键设计

- **数据模型**：`user:{phone}` 单 JSON 键存 `{ records: Record[], lastModified: number }`。Record 支持 `text | image | file` 三种类型。
- **媒体生命周期**：上传入库时写入 `expiresAt`。`getRecords` 每次访问时懒过滤过期项并异步 `del()` blob；Vercel Cron 每日兜底。
- **文本 TTL**：整条 `user:` 键 7 天无访问自动过期（`EXPIRE` 访问即刷新）。
- **客户端直传**：大文件不经过 Vercel Function，直接到 Blob；服务端仅签发 token 并在回调写元数据 — 详见 [`memory/decisions/blob-direct-upload.md`](./memory/decisions/blob-direct-upload.md)。
- **限流**：基于内存的简单滑动窗口（不依赖 Redis），通用 60 次/分钟，登录 5 次/分钟。
- **删除撤销**：5 秒前端延迟策略 + Toast 队列，服务端立即响应。

---

## 🛠 自定义建议

| 想做什么 | 修改 |
|---|---|
| 关闭手机号登录，换成密码 | 重写 `src/lib/auth.ts`，替换 `isAllowedPhone` |
| 允许多用户 | 把 `ALLOWED_PHONE` 换成 Redis 白名单 Set 或 OIDC；改 cron 端点遍历所有 phone |
| 替换手机号正则（非中国大陆） | 修改 `src/lib/auth.ts:2` 的 `PHONE_RE` |
| 调整文件大小 / TTL | `src/app/api/records/upload/route.ts` 和 `create-media/route.ts` 顶部常量 |
| 把图片改成私有 | Blob store 创建时选 `private`，前端用服务端代理下载 |
| 调整限流阈值 | `src/lib/rate-limit.ts` 顶部常量 |

---

## ⚠️ 使用须知

- Vercel Hobby 计划仅限 **非商用个人用途**（见 [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)）
- 当前代码以 **单用户** 为假设设计，朋友多人共用需评估 Vercel Blob Advanced Operations 配额
- Cron 在 Hobby 下每天只能跑 1 次；主清理依赖 lazy 过滤
- Next.js 14.2.3 存在已知安全更新建议，自部署后可按需升级到最新 14.x
- iOS Safari PWA 模式下用 JS 强制阻止双指缩放（违反 WCAG，但场景必需，详见 [`memory/decisions/pwa-js-zoom-prevention.md`](./memory/decisions/pwa-js-zoom-prevention.md)）

---

## 🤝 欢迎参与

- **看到 spec/memory 里有不严谨之处** → 开 issue 或直接提 PR
- **想用 spec skill 复现你自己的项目** → fork 走，把 specs/、memory/、PROGRESS.md 清空，从 `/spec init` 重新开始
- **对 SDD 工作流本身有想法** → 欢迎 discussion，这是个边做边迭代的过程

---

## 📝 License

[MIT](./LICENSE) © smilezyl

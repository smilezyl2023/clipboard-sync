# Sprint engineering-cleanup 任务完成快照

> 每任务一段 ≤ 200 字。Phase A 默认不读；/spec sync / /spec review / 跨任务关联追溯时读。
> 本快照基于 PROGRESS.md 与 spec [x] 任务追溯生成（spec skill 改造，2026-04-30）。

---

<a id="t-111"></a>
## T-1.1.1 ✅ 2026-04-26 — 删 package-lock.json + 修 vercel.json 用 pnpm

- 文件：删除 1（package-lock.json）/ 修改 1（vercel.json）
- 测试：自动化 1（`ls package-lock.json` 不存在 + vercel.json 含 pnpm）
- 门禁：build ✓
- Memory：新增 1 条 — decision/pnpm-as-package-manager
- 备注：—

---

<a id="t-112"></a>
## T-1.1.2 ✅ 2026-04-26 — 修复 loadToInput content 加载 bug

- 文件：修改 1（src/app/page.tsx）
- 测试：自动化 1 e2e + 手测点击文本记录
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：空字符串不应 fallback 到 preview

---

<a id="t-113"></a>
## T-1.1.3 ✅ 2026-04-26 — 统一 API 错误处理为 `{ error: string }` JSON

- 文件：修改 3（records/route.ts, cron/cleanup-blobs/route.ts, records/create-media/route.ts）
- 测试：自动化 1（所有 API 端点返回 JSON 错误体）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：新增 1 条 — convention/api-error-format
- 备注：异常路径不再返回 Next.js HTML 500 页面

---

<a id="t-121"></a>
## T-1.2.1 ✅ 2026-04-26 — 提取 AuthModal 组件

- 文件：新增 1（components/AuthModal.tsx）/ 修改 1（page.tsx）
- 测试：自动化 1（e2e 登录测试通过）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：新增 1 条 — convention/component-hooks-dirs
- 备注：—

---

<a id="t-122"></a>
## T-1.2.2 ✅ 2026-04-26 — 提取 RecordRow + RecordsSkeleton 组件

- 文件：新增 2（RecordRow.tsx, RecordsSkeleton.tsx）/ 修改 1（page.tsx）
- 测试：自动化 8/8 e2e 全通过
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：—

---

<a id="t-123"></a>
## T-1.2.3 ✅ 2026-04-27 — 提取 hooks 与工具函数（useRecords/useSwipe/format）

- 文件：新增 3（hooks/useRecords.ts, hooks/useSwipe.ts, utils/format.ts）/ 修改 1（page.tsx 降至 <400 行）
- 测试：自动化 e2e 全通过
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：新增 1 条 — integration/tailscale-dev-server
- 备注：手测期间发现 Tailscale 端口冲突，记入 memory

---

<a id="t-124"></a>
## T-1.2.4 ✅ 2026-04-27 — 统一 Record 类型定义，消除接口重复

- 文件：修改 2（src/lib/store.ts 导出基础 Record / src/app/page.tsx 扩展）
- 测试：自动化 e2e + tsc 零报错
- 门禁：type ✓ / build ✓
- Memory：0 条
- 备注：—

---

<a id="t-125"></a>
## T-1.2.5 ✅ 2026-04-27 — 清理死代码

- 文件：修改 2（globals.css 删 .auth-tabs/.auth-tab/.auth-tip / page.tsx 删 lastModified state）
- 测试：自动化 build ✓
- 门禁：build ✓
- Memory：0 条
- 备注：font-size 统一为 CSS 变量

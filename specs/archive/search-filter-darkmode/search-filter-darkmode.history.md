# Sprint search-filter-darkmode 任务完成快照

> 每任务一段 ≤ 200 字。Phase A 默认不读；/spec sync / /spec review / 跨任务关联追溯时读。
> 本快照基于 PROGRESS.md 与 spec [x] 任务追溯生成（spec skill 改造，2026-04-30）。

---

<a id="t-211"></a>
## T-2.1.1 ✅ — 搜索框 UI + 前端过滤

- 文件：新增 1（components/SearchFilter.tsx）/ 修改 1（page.tsx）
- 测试：自动化 e2e（输入关键词过滤 / 清空恢复全部）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：搜索匹配 preview/content/fileName

---

<a id="t-212"></a>
## T-2.1.2 ✅ 2026-04-29 — 类型筛选标签（全部/文本/图片/文件）

- 文件：修改 3（components/SearchFilter.tsx, page.tsx, globals.css）
- 测试：自动化 e2e 10/10 通过；类型专用空状态
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：新增 1 条 — pitfall/tailscale-port-conflict
- 备注：手测踩 Tailscale Serve 端口坑，记入 memory

---

<a id="t-221"></a>
## T-2.2.1 ✅ 2026-04-29 — 深色模式 CSS 变量 + 系统偏好检测

- 文件：新增 1（hooks/useTheme.ts）/ 修改 4（globals.css, layout.tsx, page.tsx, e2e/dark-mode.spec.ts）
- 测试：自动化 e2e + 手测清单 tests/manual/T-2.2.1-dark-mode.md
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：批量栏/Toast 用硬编码暗色背景而非反转主题色

---

<a id="t-222"></a>
## T-2.2.2 ✅ — 深色模式切换按钮 + localStorage 记忆

- 文件：修改 1（src/app/page.tsx）
- 测试：自动化 e2e + 浏览器手测（点击切换 / 刷新保持）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：—

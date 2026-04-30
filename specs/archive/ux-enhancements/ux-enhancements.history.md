# Sprint ux-enhancements 任务完成快照

> 每任务一段 ≤ 200 字。Phase A 默认不读；/spec sync / /spec review / 跨任务关联追溯时读。
> 本快照基于 PROGRESS.md 与 spec [x] 任务追溯生成（spec skill 改造，2026-04-30）。

---

<a id="t-311"></a>
## T-3.1.1 ✅ 2026-04-27 — 拖拽上传支持

- 文件：修改 2（src/app/page.tsx, globals.css）
- 测试：自动化（合成 dragenter 高亮样式 / 文本同步回归）+ 手测 OS 文件管理器拖拽
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：dragleave/拖入非文件过滤已覆盖

---

<a id="t-312"></a>
## T-3.1.2 ✅ 2026-04-27 — 修复文件下载跨域问题

- 文件：修改 1（components/RecordRow.tsx）
- 测试：自动化 e2e 8/8 通过；浏览器下载对话框触发，文件名正确
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：跨域 Blob URL 用 fetch+Blob+createObjectURL 替代 `<a download>`

---

<a id="t-321"></a>
## T-3.2.1 ✅ 2026-04-27 — lightbox ESC 关闭 + 加载占位 spinner

- 文件：修改 2（src/app/page.tsx, globals.css）
- 测试：自动化 + 浏览器手测 ESC 关闭 + spinner 显示
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：—

---

<a id="t-331"></a>
## T-3.3.1 ✅ 2026-04-27 — 删除操作撤销（5 秒延迟 + 撤销 Toast）

- 文件：修改 4（hooks/useRecords.ts, page.tsx, globals.css, components/RecordRow.tsx）
- 测试：自动化 Playwright（删除→Toast→撤销恢复 / 删除→5s→真删 / pendingDelete 按钮 disabled）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：前端延迟策略，服务端立即响应

---

<a id="t-341"></a>
## T-3.4.1 ✅ 2026-04-27 — 离线状态提示横幅

- 文件：新增 1（hooks/useOnlineStatus.ts）/ 修改 2（page.tsx, globals.css）
- 测试：自动化 Playwright（断网横幅 / 联网消失 / 离线点同步 Toast）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：—

---

<a id="t-351"></a>
## T-3.5.1 ✅ 2026-04-27 — Toast 队列（多 Toast 堆叠 + 上限 5）

- 文件：新增 1（hooks/useToastQueue.ts）/ 修改 3（page.tsx, useRecords.ts, globals.css）
- 测试：自动化 Playwright（3 Toast 堆叠 / 撤销恢复 / 5 上限）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：用 ref 管理避免 setState 冲突

---

<a id="t-361"></a>
## T-3.6.1 ✅ 2026-04-28 — 上传失败保留占位 + 重试按钮

- 文件：修改 4（components/RecordRow.tsx, page.tsx, hooks/useRecords.ts, globals.css）
- 测试：自动化 Playwright（失败状态保留 / 重试触发上传 / 复选框 disabled）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：占位项 blobPathname 为空标识失败态

---

<a id="t-371"></a>
## T-3.7.1 ✅ — 无障碍修复（focus-visible + aria-describedby）

- 文件：修改 2（globals.css, components/AuthModal.tsx）
- 测试：手测（Tab 焦点轮廓 / 屏幕阅读器读出错误）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：JS 缩放阻止代码保留（PWA 必需）

---

<a id="t-381"></a>
## T-3.8.1 ✅ 2026-04-29 — 修复 SSR 水合布局闪烁

- 文件：修改 2（src/app/page.tsx 删 isMobileSwipe state, globals.css 加 @media）
- 测试：自动化 e2e + 手测桌面/移动布局正确
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：纯 CSS @media 替代 JS 初始 state，消除闪烁

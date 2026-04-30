# Sprint security-hardening 任务完成快照

> 每任务一段 ≤ 200 字。Phase A 默认不读；/spec sync / /spec review / 跨任务关联追溯时读。
> 本快照基于 PROGRESS.md 与 spec [x] 任务追溯生成（spec skill 改造，2026-04-30）。

---

<a id="t-411"></a>
## T-4.1.1 ✅ — API 通用限流（基于 IP 的内存滑动窗口）

- 文件：新增 1（src/lib/rate-limit.ts）/ 修改 N（API route 文件）
- 测试：自动化 1（快速请求 70 次第 60+ 收 429 / 正常速度不受影响）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：单机内存实现，不依赖 Redis

---

<a id="t-412"></a>
## T-4.1.2 ✅ 2026-04-27 — 登录接口专用限流（5 次/分钟/IP）

- 文件：修改 2（src/lib/rate-limit.ts, src/app/api/auth/login/route.ts）
- 测试：自动化 1（连续登录 6 次第 6 次返回 429）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：阈值独立于通用限流，更严格

---

<a id="t-413"></a>
## T-4.1.3 ✅ 2026-04-27 — 收紧上传 MIME 白名单（移除 octet-stream）

- 文件：修改 1（src/app/api/records/upload/route.ts）
- 测试：自动化 2（PNG 上传 200 / .bin 拒绝 403）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：octet-stream 是通配类型，不应在白名单

---

<a id="t-421"></a>
## T-4.2.1 ✅ 2026-04-27 — 文本内容长度限制（10000 字符前后端双端）

- 文件：修改 3（records/create/route.ts, page.tsx, globals.css）
- 测试：自动化 2（前端 maxlength 阻止 / 后端绕过返回 400）
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：—

---

<a id="t-431"></a>
## T-4.3.1 ✅ 2026-04-27 — 图片缩略图 URL `?w=200` 参数优化

- 文件：修改 1（components/RecordRow.tsx）
- 测试：自动化 e2e 8/8 通过；缩略图 src 含 ?w=200，lightbox 不 resize
- 门禁：lint ✓ / type ✓ / build ✓
- Memory：0 条
- 备注：节省带宽 + 保留大图清晰度

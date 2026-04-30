# 项目进度

> 剪贴板同步项目优化进度追踪

---

## Spec 列表

| Spec | 状态 | 进度 | 说明 |
|------|------|------|------|
| [engineering-cleanup](specs/engineering-cleanup.md) | COMPLETED | 8/8 | 工程化修复与代码重构 |
| [security-hardening](specs/security-hardening.md) | COMPLETED | 5/5 | 安全加固 |
| [ux-enhancements](specs/ux-enhancements.md) | COMPLETED | 9/9 | 体验增强 |
| [search-filter-darkmode](specs/search-filter-darkmode.md) | COMPLETED | 4/4 | 搜索筛选与深色模式 |
| [testing](specs/testing.md) | COMPLETED | 5/5 | 测试补齐 |

---

## 任务列表

### Spec 1: engineering-cleanup（工程化修复与代码重构）

- [x] **T-1.1.1** 删除 package-lock.json + 修复 vercel.json pnpm 配置
  - 前置依赖: 无
  - 完成日期: 2026-04-26
  - 验证方式: `ls package-lock.json` 不存在；vercel.json 中命令含 pnpm

- [x] **T-1.1.2** 修复 loadToInput content 加载 bug
  - 前置依赖: 无
  - 完成日期: 2026-04-26
  - 验证方式: 点击文本记录加载的是完整 content，空字符串不 fallback 到 preview

- [x] **T-1.1.3** 统一 API 错误处理
  - 前置依赖: 无
  - 完成日期: 2026-04-26
  - 验证方式: 所有 API 端点返回 JSON `{ error: string }` 格式

- [x] **T-1.2.1** 拆分 page.tsx：提取 AuthModal 组件
  - 前置依赖: 无
  - 完成日期: 2026-04-26
  - 验证方式: 登录功能测试通过；e2e 登录测试通过

- [x] **T-1.2.2** 拆分 page.tsx：提取 RecordRow + RecordsSkeleton 组件
  - 前置依赖: T-1.2.1
  - 完成日期: 2026-04-26
  - 关键文件: `src/app/components/RecordRow.tsx`, `src/app/components/RecordsSkeleton.tsx`, `src/app/page.tsx`
  - 验证方式: e2e 8/8 全通过；类型检查零报错；构建通过；lint 无新错误

- [x] **T-1.2.3** 拆分 page.tsx：提取 hooks（useRecords, useSwipe）和工具函数
  - 前置依赖: T-1.2.2
  - 关键文件: `src/app/hooks/useRecords.ts`, `src/app/hooks/useSwipe.ts`, `src/app/utils/format.ts`, `src/app/page.tsx`
  - 验证方式: page.tsx 行数降至 400 行以内；所有 e2e 测试通过

- [x] **T-1.2.4** 统一类型定义：消除 Record 接口重复
  - 前置依赖: T-1.2.3
  - 关键文件: `src/lib/store.ts`, `src/app/page.tsx`
  - 验证方式: TypeScript 编译无报错；e2e 测试通过

- [x] **T-1.2.5** 清理死代码
  - 前置依赖: T-1.2.2
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/globals.css`, `src/app/page.tsx`
  - 验证方式: 构建通过；CSS 中无 .auth-tabs/.auth-tab/.auth-tip；page.tsx 无 lastModified state；font-size 统一为 CSS 变量

### Spec 2: security-hardening（安全加固）

- [x] **T-4.1.1** API 通用限流
  - 前置依赖: 无
  - 关键文件: `src/lib/rate-limit.ts`, API route 文件
  - 验证方式: 快速请求后收到 429；正常速度请求不受影响

- [x] **T-4.1.2** 登录接口专用限流（5次/分钟）
  - 前置依赖: T-4.1.1
  - 完成日期: 2026-04-27
  - 关键文件: `src/lib/rate-limit.ts`, `src/app/api/auth/login/route.ts`
  - 验证方式: 快速调用登录接口 6 次，第 6 次返回 429

- [x] **T-4.1.3** 收紧上传 MIME 白名单
  - 前置依赖: 无
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/api/records/upload/route.ts`
  - 验证方式: PNG 图片上传成功（200），.bin/octet-stream 文件被拒绝（403）

- [x] **T-4.2.1** 文本内容长度限制（前后端双端）
  - 前置依赖: T-4.1.1
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/api/records/create/route.ts`, `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: 超长文本前端阻止提交；绕过前端后端返回 400

- [x] **T-4.3.1** 图片缩略图 URL 参数优化
  - 前置依赖: 无
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/components/RecordRow.tsx`
  - 验证方式: 缩略图 img src 包含 `?w=200` 参数，lightbox 大图无 resize；e2e 8/8 通过

### Spec 3: ux-enhancements（体验增强）

- [x] **T-3.1.1** 拖拽上传支持
  - 前置依赖: T-1.2.3（hooks 提取完成）
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: 构建/类型检查/lint 通过；合成 dragenter 高亮样式正确；文本同步回归正常
  - ⚠️ 待手测: OS 文件管理器拖拽（dragleave/放下上传/非文件拖拽过滤/超限文件 Toast）

- [x] **T-3.1.2** 修复文件下载跨域问题
  - 前置依赖: T-1.2.2（RecordRow 拆分完成）
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/components/RecordRow.tsx`
  - 验证方式: 下载按钮渲染为 button 元素；点击 fetch+Blob URL 触发下载对话框；下载文件名正确；e2e 8/8 通过

- [x] **T-3.2.1** lightbox ESC 关闭 + 加载占位
  - 前置依赖: T-1.2.2（RecordRow 拆分完成）
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: ESC 关闭 + spinner 加载占位均已通过浏览器验证

- [x] **T-3.3.1** 删除操作撤销（延迟删除 + 撤销 Toast）
  - 前置依赖: T-1.2.3
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/hooks/useRecords.ts`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/components/RecordRow.tsx`
  - 验证方式: Playwright 自动化验证通过 — 删除→Toast→撤销恢复；删除→5s→真删除；pendingDelete button disabled；批量删除不受影响

- [x] **T-3.4.1** 离线状态提示横幅
  - 前置依赖: 无
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/page.tsx`, `src/app/hooks/useOnlineStatus.ts`, `src/app/globals.css`
  - 验证方式: 断网→横幅出现（Playwright 验证）；联网→横幅消失；离线点同步→Toast 提示

- [x] **T-3.5.1** Toast 队列（多 Toast 堆叠显示）
  - 前置依赖: 无
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/hooks/useToastQueue.ts`, `src/app/page.tsx`, `src/app/hooks/useRecords.ts`, `src/app/globals.css`
  - 验证方式: Playwright 自动化验证通过 — 3 Toast 堆叠；撤销恢复流程；5 上限正确；类型和构建通过

- [x] **T-3.6.1** 上传失败保留占位 + 重试按钮
  - 前置依赖: T-1.2.2（RecordRow 拆分完成）
  - 完成日期: 2026-04-28
  - 关键文件: `src/app/components/RecordRow.tsx`, `src/app/page.tsx`, `src/app/hooks/useRecords.ts`, `src/app/globals.css`
  - 验证方式: Playwright 验证通过 — 上传失败后占位保留显示「上传失败 · 重试」；复选框/复制/删除 disabled；点击重试重新走上传流程

- [x] **T-3.7.1** 无障碍修复（focus-visible + aria）
  - 前置依赖: T-1.2.3（hooks 提取完成）
  - 关键文件: `src/app/globals.css`, `src/app/components/AuthModal.tsx`
  - 验证方式: Tab 键可见焦点；AuthModal 错误 aria-describedby 关联 input
  - 说明: 注意不要移除 JS 缩放阻止代码（PWA 场景必需）

- [x] **T-3.8.1** 修复 SSR 水合布局闪烁
  - 前置依赖: T-1.2.2（组件拆分完成）
  - 完成日期: 2026-04-29
  - 关键文件: `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: 桌面端首次渲染无移动端布局闪烁；移动端滑动删除功能正常
  - 说明: 移除 isMobileSwipe JS state，用 CSS @media (min-width: 640px) 纯媒体查询控制布局差异

### Spec 4: search-filter-darkmode（搜索筛选与深色模式）

- [x] **T-2.1.1** 搜索框 UI + 前端过滤
  - 前置依赖: T-1.2.3（useRecords hook 提取完成）
  - 关键文件: `src/app/components/SearchFilter.tsx`
  - 验证方式: 输入关键词后列表正确过滤；清空后恢复全部

- [x] **T-2.1.2** 类型筛选标签（全部/文本/图片/文件）
  - 前置依赖: T-2.1.1
  - 完成日期: 2026-04-29
  - 关键文件: `src/app/components/SearchFilter.tsx`, `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: e2e 10/10 通过；类型专用空状态正常显示

- [x] **T-2.2.1** 深色模式 CSS 变量 + 系统偏好检测
  - 前置依赖: 无
  - 完成日期: 2026-04-29
  - 关键文件: `src/app/globals.css`, `src/app/hooks/useTheme.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `e2e/dark-mode.spec.ts`, `tests/manual/T-2.2.1-dark-mode.md`
  - 验证方式: 系统切换到深色时页面自动变暗；所有组件颜色正确；批量操作栏和 Toast 统一使用硬编码暗色背景（非反转主题色）

- [x] **T-2.2.2** 深色模式切换按钮 + localStorage 记忆
  - 前置依赖: T-2.2.1
  - 关键文件: `src/app/page.tsx`
  - 验证方式: 点击切换按钮主题切换；刷新后保持偏好

### Spec 5: testing（测试补齐）

- [x] **T-5.1.1** auth.ts 单元测试
  - 前置依赖: 无
  - 完成日期: 2026-04-30
  - 关键文件: `src/__tests__/auth.test.ts`
  - 验证方式: 18 个用例覆盖 isValidPhone / isAllowedPhone / getPhoneFromRequest / USER_TTL_SECONDS

- [x] **T-5.1.2** store.ts 单元测试
  - 前置依赖: 无
  - 完成日期: 2026-04-30
  - 关键文件: `src/__tests__/store.test.ts`
  - 验证方式: 24 个用例覆盖 getRecords（正常/空/过期过滤/Upstash 自动反序列化）、createRecord（正常/长文本预览截断/超上限截断）、createMediaRecord（正常/超上限 blob 清理）、deleteRecord（单条/不存在）、deleteRecords（批量/部分匹配）、purgeExpiredMedia（有/无过期/仅媒体）

- [x] **T-5.2.1** E2E：文本同步创建流程
  - 前置依赖: T-1.1.2（loadToInput bug 修复）
  - 完成日期: 2026-04-30
  - 关键文件: `e2e/sync-text.spec.ts`
  - 验证方式: 3 个用例覆盖主链路（文本同步→列表出现→点击加载回输入框）、空文本校验、列表累积排序；全部通过

- [x] **T-5.2.2** E2E：文件上传流程
  - 前置依赖: T-1.2.2（RecordRow 拆分完成）
  - 完成日期: 2026-04-30
  - 关键文件: `e2e/upload.spec.ts`
  - 验证方式: 选择文件 → 上传中状态 → 完成后列表显示；上传失败 → 重试按钮；全量 44 e2e 通过

- [x] **T-5.2.3** E2E：登录失败 + 批量删除边界
  - 前置依赖: T-1.2.2（组件拆分完成）
  - 完成日期: 2026-04-30
  - 关键文件: `e2e/auth-and-batch.spec.ts`
  - 验证方式: 4 用例覆盖客户端校验/API 403/500/修正重试；48/48 全量通过

---

## Bug Fixes

| Bug ID | 描述 | 日期 | 状态 | 关键文件 |
|--------|------|------|------|---------|

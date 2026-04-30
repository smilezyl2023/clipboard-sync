# Spec: 体验增强

> 创建日期: 2026-04-23
> 状态: COMPLETED
> 进度: 9/9 任务完成
> 最后更新: 2026-04-29（T-3.8.1 完成）
> 关联任务: T-3.1.1 ~ T-3.8.1
> 相关 memory: 无

## 目标（WHY）

提升产品的细节体验，减少用户操作失误的代价，增强离线、上传失败等边界场景的用户反馈，让产品更贴心。

## 功能描述（WHAT）

### 用户故事

- 作为用户，我想拖拽文件到输入区域直接上传，以便更直觉地操作
- 作为用户，我想按 ESC 关闭图片预览，以便快捷操作
- 作为用户，我想误删后能撤销，以便减少误操作损失
- 作为用户，我想断网时知道当前状态，以便不会盲目操作
- 作为用户，我想同时看到多个 Toast 提示，以便不错过重要信息
- 作为用户，我想上传失败后能重试，而不用重新选择文件
- 作为用户，我想点下载时能真正下载文件，而不是在浏览器中打开
- 作为用户，我想用键盘 Tab 操作时能看到当前焦点在哪
- 作为用户，我希望能听到屏幕阅读器播报登录错误信息

### 验收标准

- 拖拽文件到 textarea 区域时，区域高亮提示，松开后触发上传
- lightbox 支持 ESC 键关闭，显示图片加载占位（spinner）
- 删除记录后显示 "已删除 · 撤销" Toast，5 秒内点击撤销可恢复
- 离线时页面顶部显示红色横幅提示，恢复联网后自动消失
- Toast 支持队列，多个 Toast 堆叠显示，每个 3 秒后自动消失
- 上传失败时保留占位项（显示失败状态），提供重试按钮
- 文件下载点击后触发浏览器下载对话框（非新标签页打开）
- 所有交互元素有可见的 focus-visible 样式；AuthModal 错误信息通过 aria-describedby 关联输入框
- 桌面端首次渲染无移动端布局闪烁

### 边界条件

- 拖拽非文件内容（如文字）时不触发上传
- 撤销删除时若服务端已实际删除，应友好提示
- 离线状态下点击同步按钮应提示离线而非发送失败请求
- Toast 过多时（如 >5 个）最老的自动消失
- 重试上传时复用已有的占位项，不创建新项
- 文件下载使用 fetch + Blob URL 方式，注意内存释放
- JS 缩放阻止代码保留不修改（PWA 添加到主屏幕后 iOS Safari 无视 viewport 限制）
- SSR 修复不引入 useSyncExternalStore 等额外依赖，优先 CSS media query 方案

## 技术方案（HOW）

### 架构设计

- 拖拽上传：监听 textarea 区域的 dragover/dragleave/drop 事件
- lightbox：全局 keydown 监听（useEffect + cleanup）
- 撤销删除：前端延迟删除策略，5 秒内不真正发请求，仅标记为 "待删除"
- 离线提示：监听 window online/offline 事件
- Toast 队列：用 ref 管理队列状态，避免 setState 冲突
- 上传重试：保留占位项的 blobPathname 为空状态，点击重试重新走 uploadSingle 流程
- 文件下载：fetch blobUrl → 创建 Blob → URL.createObjectURL → 触发 `<a>` 点击下载 → revokeObjectURL
- focus-visible：为所有交互元素（按钮、链接、checkbox）添加 `:focus-visible` 样式
- aria：AuthModal 登录错误信息通过 `aria-describedby` 关联到输入框
- SSR 闪烁：用 CSS `@media (max-width: 639px)` 控制移动/桌面布局，消除 JS 初始状态依赖

### 架构对齐检查

1. **交互模块**：所有增强均基于现有 page.tsx / hooks 体系
2. **复用能力**：复用现有 uploadSingle、deleteRecordById 等函数
3. **Schema/API 变更**：无
4. **规范遵循**：遵循现有事件处理和状态管理约定
5. **Memory 对齐**：无冲突

### 文件变更计划

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 修改 | `src/app/page.tsx` | 集成拖拽、离线、Toast 队列；移除 isMobileSwipe state |
| 修改 | `src/app/components/RecordRow.tsx` | 添加重试按钮状态；修复文件下载方式 |
| 新增 | `src/app/hooks/useToastQueue.ts` | Toast 队列管理 hook |
| 新增 | `src/app/hooks/useOnlineStatus.ts` | 网络状态 hook |
| 修改 | `src/app/globals.css` | 添加 :focus-visible 样式；添加 Firefox 滚动条样式；确保桌面/移动布局完全由 CSS media query 控制 |

## 约束（BOUNDARIES）

- ✅ 始终：所有增强不破坏现有核心功能
- ✅ 始终：撤销删除的 5 秒延迟是前端行为，服务端仍立即响应（或延迟策略需一致）
- ⚠️ 先询问：撤销删除策略（前端延迟 vs 服务端延迟）
- 🚫 永不：引入状态管理库（如 Redux/Zustand），保持 React 原生状态

## 验证计划（VERIFICATION）

- 拖拽文件上传成功
- ESC 关闭 lightbox
- 删除后撤销恢复记录
- 断网/联网状态切换提示
- 连续触发多个 Toast 均可见
- 上传失败后重试成功
- e2e 测试通过

## 任务分解（TASKS）

### 拖拽与 Lightbox

- [x] **T-3.1.1** 拖拽上传支持
  - 前置依赖: T-1.2.3（hooks 提取完成）
  - 关键文件: `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: 构建/类型检查/lint 通过；合成 dragenter 高亮样式正确；文本同步回归正常
  - ⚠️ 待手测: OS 文件管理器拖拽场景

- [x] **T-3.2.1** lightbox ESC 关闭 + 加载占位
  - 前置依赖: T-1.2.2（RecordRow 拆分完成）
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: ESC 关闭 + spinner 加载占位均已通过浏览器验证

### 撤销与离线

- [x] **T-3.3.1** 删除操作撤销（延迟删除 + 撤销 Toast）
  - 前置依赖: T-1.2.3
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/hooks/useRecords.ts`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/components/RecordRow.tsx`
  - 验证方式: Playwright 自动化验证通过 — 删除→Toast→撤销恢复；删除→5s→真删除；pendingDelete button disabled；批量删除不受影响

- [x] **T-3.4.1** 离线状态提示横幅
  - 前置依赖: 无
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/page.tsx`, `src/app/hooks/useOnlineStatus.ts`, `src/app/globals.css`
  - 验证方式: 断网→横幅出现；联网→横幅消失；离线点同步→Toast 提示（Playwright 全验证）

### Toast 与上传

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

- [x] **T-3.1.2** 修复文件下载跨域问题
  - 前置依赖: T-1.2.2（RecordRow 拆分完成）
  - 关键文件: `src/app/components/RecordRow.tsx`
  - 验证方式: 点击文件记录下载按钮，触发浏览器下载对话框（非新标签页打开）；下载文件名正确
  - 说明: Vercel Blob URL 与站点不同源，`<a download>` 属性被浏览器忽略。改为 fetch blobUrl → Blob → URL.createObjectURL → 触发下载

- [x] **T-3.7.1** 无障碍修复（focus-visible + aria）
  - 前置依赖: T-1.2.3（hooks 提取完成）
  - 关键文件: `src/app/globals.css`, `src/app/components/AuthModal.tsx`
  - 验证方式: Tab 键导航时所有交互元素可见焦点轮廓；屏幕阅读器可读出登录错误信息
  - 说明: 为按钮/链接/checkbox 添加 :focus-visible 样式；AuthModal 错误信息通过 aria-describedby 关联 input。注意：JS 缩放阻止代码保留（PWA 场景需要，见 MEMORY.md）

- [x] **T-3.8.1** 修复 SSR 水合布局闪烁
  - 前置依赖: T-1.2.2（组件拆分完成）
  - 关键文件: `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: 桌面端首次渲染无移动端布局闪烁；移动端滑动删除功能正常
  - 说明: 移除 `isMobileSwipe` state，用 CSS `@media (max-width: 639px)` 纯媒体查询控制布局差异，消除 JS 初始状态依赖

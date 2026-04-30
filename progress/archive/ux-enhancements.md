# 归档：ux-enhancements 任务进度

> 归档日期: 2026-04-30
> Spec: [../../specs/archive/ux-enhancements/ux-enhancements.md](../../specs/archive/ux-enhancements/ux-enhancements.md)
> History: [../../specs/archive/ux-enhancements/ux-enhancements.history.md](../../specs/archive/ux-enhancements/ux-enhancements.history.md)

## 任务列表（全部完成）

- [✅] **T-3.1.1** 拖拽上传支持
  - 前置依赖: T-1.2.3（hooks 提取完成）
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: 构建/类型检查/lint 通过；合成 dragenter 高亮样式正确；文本同步回归正常
  - ⚠️ 待手测: OS 文件管理器拖拽（dragleave/放下上传/非文件拖拽过滤/超限文件 Toast）

- [✅] **T-3.1.2** 修复文件下载跨域问题
  - 前置依赖: T-1.2.2（RecordRow 拆分完成）
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/components/RecordRow.tsx`
  - 验证方式: 下载按钮渲染为 button 元素；点击 fetch+Blob URL 触发下载对话框；下载文件名正确；e2e 8/8 通过

- [✅] **T-3.2.1** lightbox ESC 关闭 + 加载占位
  - 前置依赖: T-1.2.2（RecordRow 拆分完成）
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: ESC 关闭 + spinner 加载占位均已通过浏览器验证

- [✅] **T-3.3.1** 删除操作撤销（延迟删除 + 撤销 Toast）
  - 前置依赖: T-1.2.3
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/hooks/useRecords.ts`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/components/RecordRow.tsx`
  - 验证方式: Playwright 自动化验证通过 — 删除→Toast→撤销恢复；删除→5s→真删除；pendingDelete button disabled；批量删除不受影响

- [✅] **T-3.4.1** 离线状态提示横幅
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/page.tsx`, `src/app/hooks/useOnlineStatus.ts`, `src/app/globals.css`
  - 验证方式: 断网→横幅出现（Playwright 验证）；联网→横幅消失；离线点同步→Toast 提示

- [✅] **T-3.5.1** Toast 队列(多 Toast 堆叠显示)
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/hooks/useToastQueue.ts`, `src/app/page.tsx`, `src/app/hooks/useRecords.ts`, `src/app/globals.css`
  - 验证方式: Playwright 自动化验证通过 — 3 Toast 堆叠；撤销恢复流程；5 上限正确；类型和构建通过

- [✅] **T-3.6.1** 上传失败保留占位 + 重试按钮
  - 前置依赖: T-1.2.2（RecordRow 拆分完成）
  - 完成日期: 2026-04-28
  - 关键文件: `src/app/components/RecordRow.tsx`, `src/app/page.tsx`, `src/app/hooks/useRecords.ts`, `src/app/globals.css`
  - 验证方式: Playwright 验证通过 — 上传失败后占位保留显示「上传失败 · 重试」；复选框/复制/删除 disabled；点击重试重新走上传流程

- [✅] **T-3.7.1** 无障碍修复（focus-visible + aria）
  - 前置依赖: T-1.2.3（hooks 提取完成）
  - 关键文件: `src/app/globals.css`, `src/app/components/AuthModal.tsx`
  - 验证方式: Tab 键可见焦点；AuthModal 错误 aria-describedby 关联 input
  - 说明: 注意不要移除 JS 缩放阻止代码（PWA 场景必需）

- [✅] **T-3.8.1** 修复 SSR 水合布局闪烁
  - 前置依赖: T-1.2.2（组件拆分完成）
  - 完成日期: 2026-04-29
  - 关键文件: `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: 桌面端首次渲染无移动端布局闪烁；移动端滑动删除功能正常
  - 说明: 移除 isMobileSwipe JS state，用 CSS @media (min-width: 640px) 纯媒体查询控制布局差异

# 归档：search-filter-darkmode 任务进度

> 归档日期: 2026-04-30
> Spec: [../../specs/archive/search-filter-darkmode/search-filter-darkmode.md](../../specs/archive/search-filter-darkmode/search-filter-darkmode.md)
> History: [../../specs/archive/search-filter-darkmode/search-filter-darkmode.history.md](../../specs/archive/search-filter-darkmode/search-filter-darkmode.history.md)

## 任务列表（全部完成）

- [✅] **T-2.1.1** 搜索框 UI + 前端过滤
  - 前置依赖: T-1.2.3（useRecords hook 提取完成）
  - 关键文件: `src/app/components/SearchFilter.tsx`
  - 验证方式: 输入关键词后列表正确过滤；清空后恢复全部

- [✅] **T-2.1.2** 类型筛选标签（全部/文本/图片/文件）
  - 前置依赖: T-2.1.1
  - 完成日期: 2026-04-29
  - 关键文件: `src/app/components/SearchFilter.tsx`, `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: e2e 10/10 通过；类型专用空状态正常显示

- [✅] **T-2.2.1** 深色模式 CSS 变量 + 系统偏好检测
  - 完成日期: 2026-04-29
  - 关键文件: `src/app/globals.css`, `src/app/hooks/useTheme.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `e2e/dark-mode.spec.ts`, `tests/manual/T-2.2.1-dark-mode.md`
  - 验证方式: 系统切换到深色时页面自动变暗；所有组件颜色正确；批量操作栏和 Toast 统一使用硬编码暗色背景

- [✅] **T-2.2.2** 深色模式切换按钮 + localStorage 记忆
  - 前置依赖: T-2.2.1
  - 关键文件: `src/app/page.tsx`
  - 验证方式: 点击切换按钮主题切换；刷新后保持偏好

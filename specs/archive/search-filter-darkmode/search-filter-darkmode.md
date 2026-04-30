# Spec: 搜索筛选与深色模式

> 创建日期: 2026-04-23
> 状态: COMPLETED
> 进度: 4/4 任务完成
> 最后任务: T-2.2.2 ✅ 2026-04-29 — 深色模式切换按钮 + localStorage 记忆（[详情](search-filter-darkmode.history.md#t-222)）
> 关联任务: T-2.1.1 ~ T-2.2.2
> 相关 memory: convention/css-architecture, pitfall/tailscale-port-conflict

## 目标（WHY）

解决 100 条记录中查找困难的问题，提升夜间使用体验。搜索筛选帮助用户快速定位内容，深色模式保护视力并符合现代应用标准。

## 功能描述（WHAT）

### 用户故事

- 作为用户，我想在历史记录中搜索关键词，以便快速找到之前同步的内容
- 作为用户，我想按类型筛选记录（只看文本/图片/文件），以便快速定位特定内容
- 作为用户，我想在夜间使用时切换到深色主题，以便保护视力

### 验收标准

- 历史记录区域顶部有搜索输入框，实时过滤记录列表
- 搜索支持匹配 preview、content、fileName
- 搜索为空时显示空状态提示
- 类型筛选标签：全部 / 文本 / 图片 / 文件
- 深色模式通过 CSS 变量切换，支持系统偏好检测
- 深色/浅色切换按钮在 header 区域
- 主题偏好保存在 localStorage，刷新后保持

### 边界条件

- 搜索词为空时显示全部记录
- 筛选+搜索组合使用（先筛选类型再搜索）
- 深色模式下所有组件颜色正确（包括 Toast、lightbox、batch-bar、auth-overlay）
-  prefers-reduced-motion 下过渡动画应减弱

## 技术方案（HOW）

### 架构设计

- 搜索和筛选在前端完成（记录已全量加载到内存）
- 深色模式通过 CSS 变量 + data-theme 属性控制
- 使用 matchMedia('prefers-color-scheme') 监听系统偏好

### 架构对齐检查

1. **交互模块**：搜索/筛选组件需读取 records 状态，与 useRecords hook 集成
2. **复用能力**：复用现有 CSS 变量体系，扩展深色变量
3. **Schema/API 变更**：无
4. **规范遵循**：遵循现有 CSS 变量命名约定（--background, --foreground 等）
5. **Memory 对齐**：无冲突

### 文件变更计划

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 修改 | `src/app/globals.css` | 扩展深色模式 CSS 变量 |
| 新增 | `src/app/components/SearchFilter.tsx` | 搜索框+筛选标签组件 |
| 新增 | `src/app/hooks/useTheme.ts` | 主题管理 hook |
| 修改 | `src/app/page.tsx` | 集成搜索筛选和主题切换 |
| 修改 | `src/app/layout.tsx` | 添加 data-theme 属性 |

## 约束（BOUNDARIES）

- ✅ 始终：搜索在前端过滤，不增加 API 请求
- ✅ 始终：深色模式所有颜色对比度符合 WCAG 标准
- ⚠️ 先询问：如需引入第三方主题库
- 🚫 永不：改变现有浅色主题的视觉效果

## 验证计划（VERIFICATION）

- 搜索关键词后能正确过滤记录
- 切换筛选标签后列表正确更新
- 深色模式下所有 UI 元素颜色正确
- 刷新页面后主题偏好保持
- 系统主题切换时自动跟随
- e2e 测试通过

## 任务分解（TASKS）

### 搜索筛选

- [x] **T-2.1.1** 搜索框 UI + 前端过滤
  - 前置依赖: T-1.2.3（useRecords hook 提取完成）
  - 关键文件: `src/app/components/SearchFilter.tsx`
  - 验证方式: 输入关键词后列表正确过滤；清空后恢复全部

- [x] **T-2.1.2** 类型筛选标签（全部/文本/图片/文件）
  - 前置依赖: T-2.1.1
  - 完成日期: 2026-04-29
  - 关键文件: `src/app/components/SearchFilter.tsx`, `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: 切换标签后列表正确过滤；与搜索组合使用正确；纯类型筛选空状态显示类型专用占位

### 深色模式

- [x] **T-2.2.1** 深色模式 CSS 变量 + 系统偏好检测
  - 前置依赖: 无
  - 完成日期: 2026-04-29
  - 关键文件: `src/app/globals.css`, `src/app/hooks/useTheme.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `e2e/dark-mode.spec.ts`
  - 验证方式: 系统切换到深色时页面自动变暗；所有组件颜色正确；批量操作栏和 Toast 统一使用硬编码暗色背景

- [x] **T-2.2.2** 深色模式切换按钮 + localStorage 记忆
  - 前置依赖: T-2.2.1
  - 关键文件: `src/app/page.tsx`
  - 验证方式: 点击切换按钮主题切换；刷新后保持偏好

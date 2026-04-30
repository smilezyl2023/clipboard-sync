# Spec: 工程化修复与重构

> 创建日期: 2026-04-23
> 状态: COMPLETED
> 进度: 8/8 任务完成
> 最后更新: 2026-04-27
> 关联任务: T-1.1.1 ~ T-1.2.5
> 相关 memory: 无

## 目标（WHY）

修复项目中积累的工程化问题，消除锁文件冲突、配置不匹配等隐患，同时将庞大的 page.tsx 拆分为可维护的组件结构，为后续功能迭代打好基础。

## 功能描述（WHAT）

### 用户故事

- 作为开发者，我想项目使用统一的包管理器，以便避免依赖解析不一致
- 作为开发者，我想 Vercel 部署配置与本地开发一致，以便部署流程不出错
- 作为用户，我想点击文本记录时能加载完整内容，以便编辑长文本时不丢失信息
- 作为开发者，我想代码按组件拆分，以便维护和迭代

### 验收标准

- 项目中仅存在 pnpm-lock.yaml，不存在 package-lock.json
- vercel.json 的 build/install 命令使用 pnpm
- 点击文本记录时，textarea 中加载的是 content 字段的完整内容（而非截断的 preview）
- page.tsx 拆分为：AuthModal、RecordRow、RecordsSkeleton 组件 + useRecords/useSwipe hooks
- Record 类型在 store.ts 中统一定义，page.tsx 通过扩展引入前端态字段
- 所有 API 端点返回 `{ error: string }` JSON 格式（非 HTML 页面）
- globals.css 无未使用的 CSS 类；page.tsx 无未使用的 state

### 边界条件

- 拆分组件后，所有 e2e 测试仍需通过
- 拆分后 CSS 类名不变，避免样式失效
- 空 content（空字符串）时仍应正确加载（而非 fallback 到 preview）
- API 错误统一为 JSON 格式后，前端错误处理逻辑需对应适配
- 删除 `lastModified` state 前确认无其他组件读取

## 技术方案（HOW）

### 架构设计

保持现有功能和行为不变，仅做代码组织和工程化调整。

### 架构对齐检查

1. **交互模块**：page.tsx 拆出子组件后，props 透传保持现有数据流
2. **复用能力**：工具函数（isImageMime、sanitizeFileName、formatSize、formatTime、formatRemaining）提取到独立文件
3. **Schema/API 变更**：无 API 变更
4. **规范遵循**：遵循现有 React hooks + CSS 模块的约定
5. **Memory 对齐**：无历史 memory 冲突

### 文件变更计划

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 删除 | `package-lock.json` | 移除 npm 锁文件 |
| 修改 | `vercel.json` | buildCommand/installCommand 改为 pnpm |
| 修改 | `src/app/page.tsx` | 瘦身：移除子组件和工具函数；移除 lastModified state；统一 font-size |
| 修改 | `src/app/globals.css` | 移除 .auth-tabs/.auth-tab/.auth-tip 死 CSS；统一 font-size: 16px 为变量 |
| 修改 | `src/lib/store.ts` | 导出基础 Record 类型 |
| 新增 | `src/app/components/AuthModal.tsx` | 登录遮罩组件 |
| 新增 | `src/app/components/RecordRow.tsx` | 列表行组件 |
| 新增 | `src/app/components/RecordsSkeleton.tsx` | 骨架屏组件 |
| 新增 | `src/app/hooks/useRecords.ts` | 记录状态管理 hook |
| 新增 | `src/app/hooks/useSwipe.ts` | 左滑手势 hook |
| 新增 | `src/app/utils/format.ts` | 格式化工具函数 |
| 修改 | `src/app/api/records/route.ts` | 添加 try/catch |
| 修改 | `src/app/api/cron/cleanup-blobs/route.ts` | 添加 try/catch |
| 修改 | `src/app/api/records/create-media/route.ts` | 添加 try/catch |

## 约束（BOUNDARIES）

- ✅ 始终：拆分后 e2e 测试全部通过
- ✅ 始终：功能行为与拆分前完全一致
- ⚠️ 先询问：如需调整组件目录结构
- 🚫 永不：引入新的依赖或改变构建流程

## 验证计划（VERIFICATION）

- `pnpm test:e2e` 全部通过
- 手动验证：登录、同步文本、上传文件、删除记录、左滑删除、批量删除、复制
- 手动验证：点击文本记录加载到输入框的内容是完整的（非截断）

## 任务分解（TASKS）

### 工程化修复

- [x] **T-1.1.1** 删除 package-lock.json + 修复 vercel.json pnpm 配置
  - 前置依赖: 无
  - 关键文件: `package-lock.json`, `vercel.json`
  - 验证方式: `ls package-lock.json` 不存在；vercel.json 中命令含 pnpm

- [x] **T-1.1.2** 修复 loadToInput content 加载 bug
  - 前置依赖: 无
  - 关键文件: `src/app/page.tsx`
  - 验证方式: e2e 测试通过；手动点击文本记录验证加载的是完整 content

### 代码重构

- [x] **T-1.2.1** 拆分 page.tsx：提取 AuthModal 组件
  - 前置依赖: 无
  - 关键文件: `src/app/components/AuthModal.tsx`, `src/app/page.tsx`
  - 验证方式: e2e 登录测试通过

- [x] **T-1.2.2** 拆分 page.tsx：提取 RecordRow + RecordsSkeleton 组件
  - 前置依赖: T-1.2.1
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

- [x] **T-1.1.3** 统一 API 错误处理
  - 前置依赖: 无
  - 关键文件: `src/app/api/records/route.ts`, `src/app/api/cron/cleanup-blobs/route.ts`, `src/app/api/records/create-media/route.ts`
  - 验证方式: 所有 API 端点返回 JSON `{ error: string }` 格式；非 200 状态码时客户端能正确解析错误
  - 说明: 部分 route 缺少 try/catch，异常时返回 Next.js 默认 HTML 500 页面而非 JSON。统一为 `NextResponse.json({ error }, { status })` 格式

- [x] **T-1.2.5** 清理死代码
  - 前置依赖: T-1.2.2
  - 关键文件: `src/app/globals.css`, `src/app/page.tsx`
  - 验证方式: 构建通过；CSS 文件中无 `.auth-tabs/.auth-tab/.auth-tip`；page.tsx 中无 `lastModified` state；`font-size: 16px` 统一为 CSS 变量
  - 完成日期: 2026-04-27

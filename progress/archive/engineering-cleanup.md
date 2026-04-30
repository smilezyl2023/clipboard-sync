# 归档：engineering-cleanup 任务进度

> 归档日期: 2026-04-30
> Spec: [../../specs/archive/engineering-cleanup/engineering-cleanup.md](../../specs/archive/engineering-cleanup/engineering-cleanup.md)
> History: [../../specs/archive/engineering-cleanup/engineering-cleanup.history.md](../../specs/archive/engineering-cleanup/engineering-cleanup.history.md)

## 任务列表（全部完成）

- [✅] **T-1.1.1** 删除 package-lock.json + 修复 vercel.json pnpm 配置
  - 完成日期: 2026-04-26
  - 验证方式: `ls package-lock.json` 不存在；vercel.json 中命令含 pnpm

- [✅] **T-1.1.2** 修复 loadToInput content 加载 bug
  - 完成日期: 2026-04-26
  - 验证方式: 点击文本记录加载的是完整 content，空字符串不 fallback 到 preview

- [✅] **T-1.1.3** 统一 API 错误处理
  - 完成日期: 2026-04-26
  - 验证方式: 所有 API 端点返回 JSON `{ error: string }` 格式

- [✅] **T-1.2.1** 拆分 page.tsx：提取 AuthModal 组件
  - 完成日期: 2026-04-26
  - 验证方式: 登录功能测试通过；e2e 登录测试通过

- [✅] **T-1.2.2** 拆分 page.tsx：提取 RecordRow + RecordsSkeleton 组件
  - 前置依赖: T-1.2.1
  - 完成日期: 2026-04-26
  - 关键文件: `src/app/components/RecordRow.tsx`, `src/app/components/RecordsSkeleton.tsx`, `src/app/page.tsx`
  - 验证方式: e2e 8/8 全通过；类型检查零报错；构建通过；lint 无新错误

- [✅] **T-1.2.3** 拆分 page.tsx：提取 hooks（useRecords, useSwipe）和工具函数
  - 前置依赖: T-1.2.2
  - 关键文件: `src/app/hooks/useRecords.ts`, `src/app/hooks/useSwipe.ts`, `src/app/utils/format.ts`, `src/app/page.tsx`
  - 验证方式: page.tsx 行数降至 400 行以内；所有 e2e 测试通过

- [✅] **T-1.2.4** 统一类型定义：消除 Record 接口重复
  - 前置依赖: T-1.2.3
  - 关键文件: `src/lib/store.ts`, `src/app/page.tsx`
  - 验证方式: TypeScript 编译无报错；e2e 测试通过

- [✅] **T-1.2.5** 清理死代码
  - 前置依赖: T-1.2.2
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/globals.css`, `src/app/page.tsx`
  - 验证方式: 构建通过；CSS 中无 .auth-tabs/.auth-tab/.auth-tip；page.tsx 无 lastModified state；font-size 统一为 CSS 变量

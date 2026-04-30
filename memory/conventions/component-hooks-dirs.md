# 组件与 hooks 目录约定

> 类别: convention
> 创建于: engineering-cleanup
> 关联文件: `src/app/components/`, `src/app/hooks/`, `src/app/utils/`
> 状态: active

## 概要

`src/app/{components,hooks,utils}/` 三分法，禁止内联到 page.tsx。

## 背景

工程化重构时将 `page.tsx` 拆分为模块化结构，形成固定的目录约定。

## 内容

- 组件放在 `src/app/components/`（如 `AuthModal.tsx`、`RecordRow.tsx`、`RecordsSkeleton.tsx`、`SearchFilter.tsx`）
- Hooks 放在 `src/app/hooks/`（如 `useRecords.ts`、`useSwipe.ts`、`useToastQueue.ts`、`useOnlineStatus.ts`、`useTheme.ts`）
- 工具函数放在 `src/app/utils/`（如 `format.ts`）
- 类型定义统一在 `src/lib/store.ts`

**规则**：新增代码遵循此目录结构，不将组件/hooks/工具函数内联在 `page.tsx` 中。

## 影响范围

- 所有新增 UI 逻辑的放置位置
- Code review 时检查目录约定

## 关联

- 关联 spec: `specs/archive/engineering-cleanup/engineering-cleanup.md` §代码重构

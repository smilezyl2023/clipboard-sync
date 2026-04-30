# TypeScript 路径别名 @/*

> 类别: convention
> 创建于: 项目初始化
> 关联文件: `tsconfig.json`
> 状态: active

## 背景

项目配置了 TypeScript 路径别名，避免深层相对路径导入。

## 内容

`@/*` 映射到 `./src/*`（在 `tsconfig.json` 中配置）。

```ts
// ✅ 推荐
import { getRecords } from '@/lib/store';
import { formatTime } from '@/app/utils/format';

// ❌ 避免
import { getRecords } from '../../../lib/store';
```

**规则**：在 `page.tsx` 和组件中引入模块时使用 `@/*` 别名，不使用超过 2 层的相对路径。

## 影响范围

- 所有 TypeScript 文件的 import 语句
- 新增文件遵循此约定

## 关联

- 关联 spec: `specs/engineering-cleanup.md`

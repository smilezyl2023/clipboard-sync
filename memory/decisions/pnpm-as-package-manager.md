# pnpm 作为唯一包管理器

> 类别: decision
> 创建于: engineering-cleanup
> 关联文件: `pnpm-lock.yaml`, `vercel.json`, `package.json`
> 状态: active

## 概要

唯一包管理器：磁盘效率 + 严格依赖解析，不混用 npm/yarn。

## 背景

项目曾同时存在 `package-lock.json` 和 `pnpm-lock.yaml`，依赖解析不一致可能导致部署失败。

## 内容

统一使用 pnpm，删除 `package-lock.json`，vercel.json 中 build/install 命令改用 pnpm。

**原因**：
- 磁盘空间效率优于 npm（硬链接共享）
- 严格依赖解析减少幽灵依赖
- Vercel 原生支持 pnpm

**规则**：不要混用 npm/yarn。本地开发和 CI 统一使用 `pnpm`。

## 影响范围

- `vercel.json` 的 `buildCommand` 和 `installCommand` 必须使用 pnpm
- 新增依赖时必须用 `pnpm add` 而非 `npm install`

## 关联

- 关联 spec: `specs/archive/engineering-cleanup/engineering-cleanup.md` §T-1.1.1

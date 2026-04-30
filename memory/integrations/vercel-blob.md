# Vercel Blob

> 类别: integration
> 创建于: 项目初始化
> 关联文件: `src/app/api/records/upload/route.ts`, `src/app/api/records/create-media/route.ts`
> 状态: active

## 概要

客户端直传，路径 `clipboard/{phone}/{id}/{file}`，缩略图 `?w=200`。

## 背景

项目使用 Vercel Blob 存储用户上传的图片和文件。

## 内容

### 鉴权

通过 `BLOB_READ_WRITE_TOKEN` 环境变量授权。

### 客户端上传流程

1. `POST /api/records/upload` — 服务端签发 30 分钟有效期的上传 token，校验 MIME 和大小
2. `@vercel/blob/client` 的 `upload()` 客户端直传 Blob
3. `POST /api/records/create-media` — 写 Redis 元数据

### 路径约定

Blob 路径格式：`clipboard/{phone}/{recordId}/{filename}`

### 删除

服务端通过 `del()` 或 `del([paths])` 批量删除。

### 缩略图

图片显示时附加 `?w=200` 查询参数触发 Blob 自动 resize。

### 大小限制

- 图片最大 10MB
- 文件最大 50MB

## 影响范围

- 上传、下载、删除媒体文件的全部流程
- cron 清理过期 blob

## 关联

- 关联 decision: `memory/decisions/blob-direct-upload.md`
- 关联 pitfall: `memory/pitfalls/blob-callback-localhost.md`
- 关联 integration: `memory/integrations/vercel-cron.md`

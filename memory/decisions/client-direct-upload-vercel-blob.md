# 客户端直传 Vercel Blob 绕过 Functions 4.5MB 限制

> 类别: decision
> 创建于: 项目初始化
> 关联文件: `src/app/api/records/upload/route.ts`, `src/app/api/records/create-media/route.ts`
> 状态: active

## 背景

Vercel Functions 请求体限制 4.5MB，服务端接收文件不可行。需要一种方式上传最大 50MB 的文件。

## 内容

三步上传流程，客户端直传 Vercel Blob：

1. `POST /api/records/upload` — 服务端签发 30 分钟有效期的上传 token，同时校验 MIME 类型和文件大小
2. `@vercel/blob/client` 的 `upload()` 客户端直传 Blob 存储
3. `POST /api/records/create-media` — 写 Redis 元数据（blobPathname、size、type）

**原因**：绕过 Functions 4.5MB 请求体限制，文件直接从浏览器传到 Blob 存储。

**代价**：
- 三步流程增加复杂度
- 上传和元数据写入之间可能不一致（客户端在第 3 步失败时，blob 已上传但 Redis 无记录，通过 cron 兜底清理）
- `onUploadCompleted` 回调在本地开发无法触发，客户端必须显式调用 create-media

## 影响范围

- upload route 和 create-media route 必须保持一致的校验逻辑
- cron cleanup 是三步流程不一致的兜底保障

## 关联

- 关联 pitfall: `memory/pitfalls/vercel-blob-onuploadcompleted-local-dev.md`
- 关联 integration: `memory/integrations/vercel-blob.md`

# Vercel Blob onUploadCompleted 在本地开发无法触发

> 类别: pitfall
> 创建于: 项目初始化
> 关联文件: `src/app/api/records/upload/route.ts`
> 状态: active

## 背景

Vercel Blob 的 `onUploadCompleted` 回调在本地开发环境（localhost）无法被 Blob 服务端回调到，因此不能作为上传完成的可靠触发点。

## 内容

`upload/route.ts` 中 `onUploadCompleted` 回调被保留为 no-op，注释标注「本地开发无法收到回调」。

客户端必须在上传完成后显式调用 `POST /api/records/create-media` 完成 Redis 元数据写入，不能依赖服务端回调。

## 影响范围

- 上传流程的设计必须基于「客户端主动通知」模式，不能依赖服务端回调
- 生产环境虽然回调可能触发，但为保持一致性，仍使用客户端主动通知

## 关联

- 关联 decision: `memory/decisions/client-direct-upload-vercel-blob.md`
- 关联 integration: `memory/integrations/vercel-blob.md`

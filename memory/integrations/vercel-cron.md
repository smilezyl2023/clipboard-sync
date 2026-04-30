# Vercel Cron

> 类别: integration
> 创建于: 项目初始化
> 关联文件: `vercel.json`, `src/app/api/cron/cleanup-blobs/route.ts`
> 状态: active

## 背景

三步上传流程中，如果客户端在 blob 上传成功后、create-media 调用前失败，blob 已存储但 Redis 无记录，造成「孤儿 blob」。Cron Job 每日兜底清理这些过期媒体。

## 内容

### 配置

在 `vercel.json` 的 `crons` 字段配置：

```json
{
  "crons": [{
    "path": "/api/cron/cleanup-blobs",
    "schedule": "0 3 * * *"
  }]
}
```

每日 03:00 UTC 触发。

### Auth

`Authorization: Bearer $CRON_SECRET`，由 Vercel 自动注入环境变量。Cron route 在校验 `CRON_SECRET` 存在且匹配后才执行清理。

### 清理逻辑

遍历所有用户的 media 记录，删除超过 3 小时 TTL 的 blob 文件和 Redis 记录。

## 影响范围

- 是上传流程不一致的兜底保障，不可移除
- 添加新的媒体类型时需确认 cron 清理逻辑兼容

## 关联

- 关联 decision: `memory/decisions/client-direct-upload-vercel-blob.md`
- 关联 integration: `memory/integrations/vercel-blob.md`

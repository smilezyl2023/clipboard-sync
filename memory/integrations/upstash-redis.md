# Upstash Redis

> 类别: integration
> 创建于: 项目初始化
> 关联文件: `src/lib/redis.ts`, `src/lib/store.ts`
> 状态: active

## 概要

`Redis.fromEnv()` 连接，key `user:{phone}`，文本 7 天 TTL，记录上限 100 条。

## 背景

项目使用 Upstash Redis 存储用户数据和记录索引。

## 内容

### 连接

通过 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 环境变量连接。客户端初始化 `Redis.fromEnv()`（`src/lib/redis.ts`）。

### 数据模型

- Key: `user:{phone}`
- Value: JSON `{ records: Record[], lastModified: number }`
- TTL: 7 天（`USER_TTL_SECONDS`，定义在 `auth.ts`）

### 注意事项

- Upstash SDK REST API 可能自动反序列化 JSON 字符串，`readUser()` 需防御性判断（见 pitfall）
- 记录上限 100 条（`MAX_RECORDS`），超出时截断最老记录
- 媒体记录额外 3 小时 TTL（`MEDIA_TTL_MS`），过期后前端过滤不展示

## 影响范围

- 所有数据读写操作
- 限流（当前为内存实现，未来若需分布式限流可迁移至 Redis）

## 关联

- 关联 pitfall: `memory/pitfalls/upstash-deserialize.md`

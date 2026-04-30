# Upstash Redis REST API 自动反序列化 JSON

> 类别: pitfall
> 创建于: 项目初始化
> 关联文件: `src/lib/store.ts`
> 状态: active

## 概要

Upstash REST API 可能自动反序列化 JSON，须 `typeof raw === 'string'` 防御性判断。

## 背景

Upstash SDK 的 REST API 在某些版本下会自动将存储的 JSON 字符串反序列化为 JavaScript 对象，导致 `readUser()` 返回的结果类型不确定。

## 内容

`store.ts` 中的 `readUser()` 通过 `typeof raw === 'string'` 防御性判断兼容两种行为：

```ts
const raw = await redis.get(key);
if (typeof raw === 'string') {
  return JSON.parse(raw) as UserData;
}
return raw as unknown as UserData;
```

**规则**：修改 store.ts 时必须保持这个判断，不能假设 `redis.get()` 一定返回字符串或一定返回对象。

## 影响范围

- `src/lib/store.ts` 中所有读取 Redis 数据的函数
- 不能移除 `typeof raw === 'string'` 判断

## 关联

- 关联 integration: `memory/integrations/upstash-redis.md`

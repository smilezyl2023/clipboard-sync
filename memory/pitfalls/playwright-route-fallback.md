# Playwright route.continue() 跳过后续 handler

> 类别: pitfall
> 创建于: T-5.2.2
> 关联文件: `e2e/helpers.ts`, `e2e/history-delete.spec.ts`
> 状态: active

## 概要

mock 辅助函数对不关心的方法应用 `route.fallback()` 而非 `route.continue()`。

## 背景

修复 T-5.2.2 回归时发现 2 个 history-delete 测试失败，`deletedId` 始终为 null。根因是 `mockRecordsList` 的 `**/api/records` 路由在非 GET 请求时调用了 `route.continue()`，导致 DELETE 请求绕过后续 `**/api/records/delete**` handler 直接发往真实服务端。

## 内容

Playwright 中多个 route handler 匹配同一 URL 时：
- `route.fulfill()` — 拦截并返回 mock 响应，不再传递
- `route.fallback()` — 传递给下一个匹配的 route handler；无更多 handler 时发往服务端
- `route.continue()` — **直接发往服务端，跳过所有后续 handler**

在 mock 辅助函数中，对不关心的 HTTP 方法应使用 `route.fallback()` 而非 `route.continue()`，否则会意外短路后续 handler。

```ts
// ❌ 错误：非 GET 被 continue() 发往真实服务端，后续 handler 收不到
await page.route('**/api/records', async route => {
  if (route.request().method() !== 'GET') {
    await route.continue()
    return
  }
  await route.fulfill({ ... })
})

// ✅ 正确：非 GET 用 fallback() 传递给后续 handler
await page.route('**/api/records', async route => {
  if (route.request().method() !== 'GET') {
    await route.fallback()
    return
  }
  await route.fulfill({ ... })
})
```

## 影响范围

- 所有使用 `page.route()` mock API 的 e2e 测试
- 特别是公共 mock 辅助函数（如 `mockRecordsList`），它们匹配的 URL 前缀可能覆盖更具体的路由

## 关联

- 关联 spec: `specs/archive/testing/testing.md` §T-5.2.2
- 关联文件: `e2e/helpers.ts`（`mockRecordsList` 已修复为 `fallback()`）

# API 错误响应格式

> 类别: convention
> 创建于: engineering-cleanup
> 关联文件: `src/app/api/*/route.ts`
> 状态: active

## 概要

统一 `{ error: string }` JSON 中文错误，标准 HTTP 状态码 400/401/403/404/429/500。

## 背景

部分 route 缺少 try/catch，异常时返回 Next.js 默认 HTML 500 页面而非结构化 JSON，前端无法解析。

## 内容

统一返回格式：

```ts
NextResponse.json({ error: '错误描述' }, { status: number })
```

- 错误信息使用中文
- 状态码区分：
  - `400` — 客户端错误（参数缺失/格式错误/超限）
  - `401` — 未授权（缺少或无效 phone header）
  - `403` — 无权限（不在白名单 / MIME 类型不允许）
  - `404` — 资源不存在
  - `429` — 触发限流
  - `500` — 服务端错误

**规则**：
- 所有 API 路由必须包裹 try/catch，catch 中返回 `{ error: string }` JSON
- 新增路由遵循此格式
- 前端错误处理依赖 `error` 字段展示用户提示

## 影响范围

- 所有 `/api/*` 路由文件
- 前端 `fetch()` 调用处的 `.catch()` 和错误展示逻辑

## 关联

- 关联 spec: `specs/archive/engineering-cleanup/engineering-cleanup.md` §T-1.1.3

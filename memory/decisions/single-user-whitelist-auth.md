# 单用户白名单鉴权（明文手机号头 + 环境变量）

> 类别: decision
> 创建于: 项目初始化
> 关联文件: `src/lib/auth.ts`, `src/app/api/*/route.ts`
> 状态: active

## 概要

`x-user-phone` 明文头 + `ALLOWED_PHONE` 环境变量，单用户场景最简鉴权方案。

## 背景

项目面向个人自部署场景，仅需验证「是否是部署者本人」而非多用户 RBAC。需要选择一个最简单的鉴权方案。

## 内容

选择 `x-user-phone` 明文头 + `ALLOWED_PHONE` 环境变量，而非 JWT / Session / OAuth。

**原因**：
- 单用户场景下 JWT 引入不必要的复杂性（密钥管理、刷新机制）
- 无数据库存储 session 的需求
- 部署者只需设一个环境变量即可完成认证

**代价**：
- 手机号泄露即可伪造请求（HTTPS + Tailscale 网络层面缓解）
- 无过期 / 吊销机制

**实现**：`getPhoneFromRequest()` 从请求头提取 `x-user-phone`，与 `ALLOWED_PHONE` 环境变量比较，不匹配返回 401。

## 影响范围

- 所有 API 路由必须在 handler 开头调用 `getPhoneFromRequest()`
- 新增 API 端点时不可遗漏鉴权检查

## 关联

- 关联 spec: 无（项目初始化决策）

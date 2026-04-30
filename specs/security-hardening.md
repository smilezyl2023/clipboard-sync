# Spec: 安全加固

> 创建日期: 2026-04-23
> 状态: COMPLETED
> 进度: 5/5 任务完成
> 最后更新: 2026-04-27
> 关联任务: T-4.1.1 ~ T-4.1.3, T-4.2.1 ~ T-4.3.1
> 相关 memory: 无

## 目标（WHY）

增强系统的健壮性和安全性，防止 API 被滥用导致 Redis/Blob 配额耗尽，防止超长文本撑爆存储，优化图片加载带宽。

## 功能描述（WHAT）

### 用户故事

- 作为运维，我想 API 有限流保护，以便防止恶意请求耗尽配额
- 作为运维，我想登录接口有更严格的限流，以便防止暴力枚举
- 作为用户，我想同步超长文本时收到友好提示，以便知道内容超限
- 作为用户，我想图片缩略图加载更快，以便节省流量

### 验收标准

- API 端点（create、upload、delete、records）有基于 IP 的限流（60次/分钟）
- 登录接口 `/api/auth/login` 有更严格的限流（5次/分钟/IP）
- 超限返回 429 Too Many Requests
- 文本内容单条限制 10000 字符
- 前端 textarea 显示字符限制（如 10000/10000），超限后阻止提交
- 图片缩略图使用 Vercel Blob 的 resize 参数（如 `?w=200`）生成小图
- upload route 白名单中移除 `application/octet-stream`

### 边界条件

- 限流不影响正常用户操作（60次/分钟足够）
- 登录限流 5次/分钟，正常用户输错几次不会触发
- 文本内容在 10000 字符边界时的处理
- 缩略图参数对非图片类型不生效（安全）
- 移除 `application/octet-stream` 后，需确认所有合法文件类型仍在白名单中

## 技术方案（HOW）

### 架构设计

- 限流：基于内存的简单滑动窗口（Map<ip+endpoint, count[]>），不需要额外依赖
- 登录限流：同机制但阈值更严格（5次/分钟/IP），独立于通用限流
- 文本限制：前端 maxlength + 后端校验双保险
- 缩略图：Vercel Blob 支持 URL 参数调整尺寸
- MIME 白名单：移除通配类型 `application/octet-stream`，保留明确的类型列表

### 架构对齐检查

1. **交互模块**：限流中间件在 API route 中使用
2. **复用能力**：复用现有 API 响应格式
3. **Schema/API 变更**：create API 新增长度校验错误码
4. **规范遵循**：遵循现有错误响应格式 { error: string }
5. **Memory 对齐**：无冲突

### 文件变更计划

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 新增 | `src/lib/rate-limit.ts` | 限流工具 |
| 修改 | `src/app/api/records/create/route.ts` | 添加限流 + 长度校验 |
| 修改 | `src/app/api/records/route.ts` | 添加限流 |
| 修改 | `src/app/api/records/delete/route.ts` | 添加限流 |
| 修改 | `src/app/api/records/upload/route.ts` | 添加限流 + 收紧 MIME 白名单 |
| 修改 | `src/app/api/auth/login/route.ts` | 添加登录专用严格限流（5次/分钟） |
| 修改 | `src/app/page.tsx` | textarea 字符限制提示 |
| 修改 | `src/app/components/RecordRow.tsx` | 缩略图 URL 加参数 |

## 约束（BOUNDARIES）

- ✅ 始终：限流不引入新依赖
- ✅ 始终：文本限制前后端双校验
- ⚠️ 先询问：如需调整限流阈值
- 🚫 永不：使用 Redis 做分布式限流（单机足够）

## 验证计划（VERIFICATION）

- 快速发送 70 个请求，后 10 个收到 429
- 登录接口 6 次快速调用，第 6 次返回 429
- 提交 10001 字符文本，前端阻止 + 后端返回 400
- 图片缩略图 URL 包含 resize 参数
- `application/octet-stream` 类型文件被拒绝上传
- 正常操作不受影响
- e2e 测试通过

## 任务分解（TASKS）

- [x] **T-4.1.1** API 限流（基于 IP 的简单窗口计数）
  - 前置依赖: 无
  - 关键文件: `src/lib/rate-limit.ts`, API route 文件
  - 验证方式: 快速请求后收到 429；正常速度请求不受影响

- [x] **T-4.2.1** 文本内容长度限制（前后端双端）
  - 前置依赖: T-4.1.1
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/api/records/create/route.ts`, `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: 超长文本前端阻止提交；绕过前端后端返回 400

- [x] **T-4.3.1** 图片缩略图 URL 参数优化
  - 前置依赖: 无
  - 关键文件: `src/app/components/RecordRow.tsx`
  - 验证方式: 缩略图 img src 包含 resize 参数；e2e 图片测试通过

- [x] **T-4.1.2** 登录接口专用限流
  - 前置依赖: T-4.1.1
  - 完成日期: 2026-04-27
  - 关键文件: `src/lib/rate-limit.ts`, `src/app/api/auth/login/route.ts`
  - 验证方式: 快速调用登录接口 6 次，第 6 次返回 429

- [x] **T-4.1.3** 收紧上传 MIME 白名单
  - 前置依赖: 无
  - 关键文件: `src/app/api/records/upload/route.ts`
  - 验证方式: 移除 `application/octet-stream`，确认现有文件类型仍可上传

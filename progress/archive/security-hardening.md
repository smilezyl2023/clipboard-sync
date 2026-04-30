# 归档：security-hardening 任务进度

> 归档日期: 2026-04-30
> Spec: [../../specs/archive/security-hardening/security-hardening.md](../../specs/archive/security-hardening/security-hardening.md)
> History: [../../specs/archive/security-hardening/security-hardening.history.md](../../specs/archive/security-hardening/security-hardening.history.md)

## 任务列表（全部完成）

- [✅] **T-4.1.1** API 通用限流
  - 关键文件: `src/lib/rate-limit.ts`, API route 文件
  - 验证方式: 快速请求后收到 429；正常速度请求不受影响

- [✅] **T-4.1.2** 登录接口专用限流（5 次/分钟）
  - 前置依赖: T-4.1.1
  - 完成日期: 2026-04-27
  - 关键文件: `src/lib/rate-limit.ts`, `src/app/api/auth/login/route.ts`
  - 验证方式: 快速调用登录接口 6 次，第 6 次返回 429

- [✅] **T-4.1.3** 收紧上传 MIME 白名单
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/api/records/upload/route.ts`
  - 验证方式: PNG 图片上传成功（200），.bin/octet-stream 文件被拒绝（403）

- [✅] **T-4.2.1** 文本内容长度限制（前后端双端）
  - 前置依赖: T-4.1.1
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/api/records/create/route.ts`, `src/app/page.tsx`, `src/app/globals.css`
  - 验证方式: 超长文本前端阻止提交；绕过前端后端返回 400

- [✅] **T-4.3.1** 图片缩略图 URL 参数优化
  - 完成日期: 2026-04-27
  - 关键文件: `src/app/components/RecordRow.tsx`
  - 验证方式: 缩略图 img src 包含 `?w=200` 参数，lightbox 大图无 resize；e2e 8/8 通过

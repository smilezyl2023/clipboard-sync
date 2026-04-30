# 归档：testing 任务进度

> 归档日期: 2026-04-30
> Spec: [../../specs/archive/testing/testing.md](../../specs/archive/testing/testing.md)
> History: [../../specs/archive/testing/testing.history.md](../../specs/archive/testing/testing.history.md)

## 任务列表（全部完成）

- [✅] **T-5.1.1** auth.ts 单元测试
  - 完成日期: 2026-04-30
  - 关键文件: `src/__tests__/auth.test.ts`
  - 验证方式: 18 个用例覆盖 isValidPhone / isAllowedPhone / getPhoneFromRequest / USER_TTL_SECONDS

- [✅] **T-5.1.2** store.ts 单元测试
  - 完成日期: 2026-04-30
  - 关键文件: `src/__tests__/store.test.ts`
  - 验证方式: 24 个用例覆盖 getRecords（正常/空/过期过滤/Upstash 自动反序列化）、createRecord（正常/长文本预览截断/超上限截断）、createMediaRecord（正常/超上限 blob 清理）、deleteRecord（单条/不存在）、deleteRecords（批量/部分匹配）、purgeExpiredMedia（有/无过期/仅媒体）

- [✅] **T-5.2.1** E2E：文本同步创建流程
  - 前置依赖: T-1.1.2（loadToInput bug 修复）
  - 完成日期: 2026-04-30
  - 关键文件: `e2e/sync-text.spec.ts`
  - 验证方式: 3 个用例覆盖主链路（文本同步→列表出现→点击加载回输入框）、空文本校验、列表累积排序；全部通过

- [✅] **T-5.2.2** E2E：文件上传流程
  - 前置依赖: T-1.2.2（RecordRow 拆分完成）
  - 完成日期: 2026-04-30
  - 关键文件: `e2e/upload.spec.ts`
  - 验证方式: 选择文件 → 上传中状态 → 完成后列表显示；上传失败 → 重试按钮；全量 44 e2e 通过

- [✅] **T-5.2.3** E2E：登录失败 + 批量删除边界
  - 前置依赖: T-1.2.2（组件拆分完成）
  - 完成日期: 2026-04-30
  - 关键文件: `e2e/auth-and-batch.spec.ts`
  - 验证方式: 4 用例覆盖客户端校验/API 403/500/修正重试；48/48 全量通过

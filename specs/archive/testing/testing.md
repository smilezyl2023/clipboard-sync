# Spec: 测试补齐

> 创建日期: 2026-04-26
> 状态: COMPLETED
> 进度: 5/5 任务完成
> 最后任务: T-5.2.3 ✅ 2026-04-30 — E2E 登录失败 + 批量删除边界（[详情](testing.history.md#t-523)）
> 关联任务: T-5.1.1 ~ T-5.2.3
> 相关 memory: pitfall/upstash-deserialize, pitfall/playwright-route-fallback

## 目标（WHY）

当前项目仅有 8 个 E2E 用例（覆盖 loading/error/retry、复制、删除），缺少单元测试和关键业务流程的 E2E 覆盖。补齐测试可以提高重构信心，防止回归。

## 功能描述（WHAT）

### 用户故事

- 作为开发者，我想 `auth.ts` 的校验逻辑有单元测试，以便重构时不会引入 bug
- 作为开发者，我想 `store.ts` 的数据操作有单元测试，以便确保 Redis 读写逻辑正确
- 作为开发者，我想关键业务流程有 E2E 测试（文本同步、文件上传、登录失败），以便减少手工回归

### 验收标准

- `auth.ts` 中 `isValidPhone` 和 `isAllowedPhone` 有完整边界测试
- `store.ts` 中 `getRecords`、`createRecord`、`createMediaRecord`、`deleteRecords`、过期过滤、MAX_RECORDS 截断逻辑有测试
- E2E 覆盖：文本同步创建 → 列表出现 → 点击加载到输入框
- E2E 覆盖：文件选择 → 上传进度 → 列表出现
- E2E 覆盖：错误手机号登录失败提示、批量删除取消/确认

### 边界条件

- 单元测试 mock Redis 和 Blob 依赖，不连真实服务
- E2E 测试 mock API 响应，不依赖真实 Redis/Blob
- 测试不影响现有 8 个 E2E 用例的通过

## 技术方案（HOW）

### 架构设计

- 单元测试框架：`vitest`（轻量、与 TypeScript 原生兼容、Vite 生态）
- 单元测试文件放在 `src/__tests__/` 目录
- E2E 继续用 Playwright，放在 `e2e/` 目录
- 不引入 jest 或 babel，保持工具链简洁

### 架构对齐检查

1. **交互模块**：不涉及 UI 交互
2. **复用能力**：单元测试复用被测模块的类型定义
3. **Schema/API 变更**：无
4. **规范遵循**：测试文件命名 `*.test.ts`
5. **Memory 对齐**：无冲突

### 文件变更计划

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 新增 | `package.json` | 添加 vitest 依赖和 test 脚本 |
| 新增 | `vitest.config.ts` | vitest 配置 |
| 新增 | `src/__tests__/auth.test.ts` | auth.ts 单元测试 |
| 新增 | `src/__tests__/store.test.ts` | store.ts 单元测试 |
| 新增 | `e2e/sync-text.spec.ts` | E2E：文本同步流程 |
| 新增 | `e2e/upload.spec.ts` | E2E：文件上传流程 |
| 新增 | `e2e/auth-and-batch.spec.ts` | E2E：登录失败 + 批量删除边界 |

## 约束（BOUNDARIES）

- ✅ 始终：单元测试不连接真实 Redis/Blob
- ✅ 始终：E2E 测试不依赖真实外部服务
- ✅ 始终：所有测试在 `pnpm test` 和 `pnpm test:e2e` 下通过
- ⚠️ 先询问：如需引入 jest 替代 vitest
- 🚫 永不：在测试中使用真实的 Upstash Redis 或 Vercel Blob token

## 验证计划（VERIFICATION）

- `pnpm test` 运行单元测试，全部通过
- `pnpm test:e2e` 运行所有 E2E 测试，全部通过
- 新增 E2E 用例与现有 8 个用例共存不冲突

## 任务分解（TASKS）

### 单元测试

- [x] **T-5.1.1** auth.ts 单元测试
  - 前置依赖: 无
  - 关键文件: `src/__tests__/auth.test.ts`
  - 验证方式: 覆盖 isValidPhone（有效/无效/边界）和 isAllowedPhone（匹配/不匹配/未配置环境变量）

- [x] **T-5.1.2** store.ts 单元测试
  - 前置依赖: 无
  - 关键文件: `src/__tests__/store.test.ts`
  - 验证方式: 覆盖 getRecords（正常/空/过期过滤）、createRecord（正常/超上限截断）、createMediaRecord（正常/超上限清理 blob）、deleteRecords（单条/批量/不存在 ID）

### E2E 测试

- [x] **T-5.2.1** E2E：文本同步创建流程
  - 前置依赖: T-1.1.2（loadToInput bug 修复）
  - 关键文件: `e2e/sync-text.spec.ts`
  - 验证方式: 输入文本 → 同步 → 列表出现新记录 → 点击加载回输入框

- [x] **T-5.2.2** E2E：文件上传流程
  - 前置依赖: T-1.2.2（RecordRow 拆分完成）
  - 关键文件: `e2e/upload.spec.ts`
  - 验证方式: 选择文件 → 进度条出现 → 上传完成 → 列表中显示文件记录

- [x] **T-5.2.3** E2E：登录失败 + 批量删除边界
  - 前置依赖: T-1.2.2（组件拆分完成）
  - 关键文件: `e2e/auth-and-batch.spec.ts`
  - 验证方式: 错误手机号提交显示错误提示；批量选择删除 → 取消不删除 → 确认正确删除多条

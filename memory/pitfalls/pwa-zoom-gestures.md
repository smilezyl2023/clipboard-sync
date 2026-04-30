# JS 手势阻止缩放是 PWA 的无奈之举

> 类别: pitfall
> 创建于: 用户体验讨论
> 关联文件: `src/app/page.tsx`
> 状态: active

## 概要

JS 阻止双指/Ctrl 滚轮缩放违反 WCAG 但 PWA 场景无替代方案，禁止移除。

## 背景

App 需要作为 PWA 添加到手机主屏幕使用。iOS Safari 在 PWA 模式下无视 viewport meta 的 `user-scalable=no` 和 `maximum-scale=1`，用户仍可双指缩放，破坏类原生 App 体验。

## 内容

只能通过 JS 层 `preventDefault()` 阻止：
- `gesturestart` / `gesturechange` / `gestureend` 事件
- 双指 `touchmove`（`touches.length > 1`）
- `Ctrl` + 滚轮

这违反了 WCAG 无障碍标准（SC 2.2.2 文本缩放），但对于 PWA 场景没有更好的替代方案。

**规则**：不要移除这些 JS 阻止代码。任何「无障碍修复」任务中必须明确排除这部分。

## 影响范围

- `src/app/page.tsx` 中的手势阻止逻辑不可触碰
- 无障碍改进工作必须绕过此限制

## 关联

- 关联 decision: `memory/decisions/pwa-js-zoom-prevention.md`

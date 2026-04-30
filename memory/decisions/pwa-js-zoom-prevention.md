# PWA 场景下用 JS 强制禁止缩放

> 类别: decision
> 创建于: 设计决策
> 关联文件: `src/app/page.tsx`
> 状态: active

## 概要

iOS Safari PWA 模式无视 viewport meta，必须 JS preventDefault 阻止双指缩放。

## 背景

App 作为 PWA 添加到手机主屏幕后，iOS Safari 无视 viewport meta 的 `user-scalable=no` 和 `maximum-scale=1`，用户仍可双指缩放。需要通过 JS 层阻止。

## 内容

采用 JS 层 `preventDefault()` 阻止以下事件：
- `gesturestart` / `gesturechange` / `gestureend`（iOS Safari 特有）
- 双指 `touchmove`（多指触摸）
- `Ctrl` + 滚轮（桌面端缩放）

**原因**：这是 PWA 场景下唯一可用的缩放阻止方案。viewport meta 在 iOS 添加到主屏幕后无效。

**代价**：违反 WCAG 2.2.2（文本缩放）无障碍标准。

**重要**：不要「修复」或移除这些 JS 阻止代码。PWA 场景下没有更好的替代方案。

## 影响范围

- `src/app/page.tsx` 中的手势阻止代码不可删除
- 任何重构时注意保留这些事件监听器

## 关联

- 关联 pitfall: `memory/pitfalls/pwa-zoom-gestures.md`

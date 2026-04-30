# CSS 体系

> 类别: convention
> 创建于: 项目初始化
> 关联文件: `src/app/globals.css`
> 状态: active

## 背景

项目不使用 Tailwind CSS，所有样式集中在 `globals.css` 中管理。

## 内容

- 使用纯 CSS 和 CSS 自定义属性（HSL 变量）管理样式
- 命名约定为 BEM 风格前缀：`.auth-`、`.record-`、`.toast-`、`.batch-`、`.lightbox-` 等
- 深色模式通过 `[data-theme="dark"]` 选择器 + CSS 变量覆盖实现
- 响应式断点：`@media (min-width: 640px)` 区分移动端/桌面端

**规则**：
- 新增样式必须放入 `globals.css`，不创建独立 CSS 文件或 CSS-in-JS
- 新组件使用一致的 BEM 风格类名前缀
- 颜色使用 CSS 变量（如 `var(--background)`）而非硬编码值

## 影响范围

- 所有 UI 组件的样式定义
- 不引入 Tailwind 或其他 CSS 框架

## 关联

- 关联 spec: `specs/search-filter-darkmode.md` §深色模式

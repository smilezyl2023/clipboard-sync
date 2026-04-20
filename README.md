# 剪贴板同步

一个简洁优雅的跨设备文字粘贴同步工具，基于 Next.js 构建，可直接部署到 Vercel。

## ✨ 功能特点

- 🌐 **跨平台访问**：支持桌面端和移动端浏览器，无需安装任何应用
- 📡 **实时同步**：使用轮询机制保持多设备数据同步
- 📜 **历史记录**：保存最近 100 条粘贴历史，方便重复使用
- 🗑️ **批量管理**：支持选择和批量删除历史记录
- 📱 **响应式设计**：完美适配手机、平板和桌面设备
- 🎨 **简洁 UI**：shadcn/ui 风格，简洁优雅

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 部署到 Vercel

1. Fork 此仓库到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 点击 Deploy 即可

或者使用 Vercel CLI：

```bash
npm i -g vercel
vercel
```

## 📁 项目结构

```
clipboard-sync-nextjs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── records/
│   │   │       ├── route.ts          # GET 获取记录
│   │   │       ├── create/
│   │   │       │   └── route.ts      # POST 创建记录
│   │   │       └── delete/
│   │   │           └── route.ts      # DELETE 删除记录
│   │   ├── globals.css               # 全局样式
│   │   ├── layout.tsx                # 布局组件
│   │   └── page.tsx                  # 主页面
│   └── lib/
│       └── store.ts                  # 数据存储
├── vercel.json                       # Vercel 配置
├── package.json
└── README.md
```

## ⚠️ 注意事项

- 由于 Vercel Serverless 环境的限制，使用轮询替代 SSE 进行实时同步
- 数据存储在内存中，Vercel 冷启动时会重置数据
- 如需持久化存储，建议连接数据库（如 Vercel Postgres、Redis 等）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📝 License

MIT

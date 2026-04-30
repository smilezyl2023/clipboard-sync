# Tailscale Serve 与 Next.js Dev Server 端口冲突

> 类别: pitfall
> 创建于: T-2.1.2
> 关联文件: `memory/integrations/tailscale-dev-server.md`
> 状态: active

## 背景

在调试 T-2.1.2 的 e2e 测试时，需要暂时停掉 Tailscale Serve 释放 3000 端口给 Playwright 的 webServer。测试完成后恢复 Tailscale Serve，重启 dev server 时报 EADDRINUSE，但 `lsof -i:3000` 却看不到进程。

## 内容

### 根因

- Next.js dev server 默认监听 `::`（IPv6 通配地址，兼容 IPv4 映射），会尝试绑定**所有网络接口**的 3000 端口
- Tailscale Serve 在后台绑定了 tailnet IP（`100.x.x.x`）和 tailnet IPv6 地址上的 3000 端口
- 这两个地址属于 Next.js 试图绑定的「所有接口」范围，因此 EADDRINUSE
- `lsof -i:3000` 看不到，因为 lsof 默认只显示 `0.0.0.0`/`::` 这种通配绑定，而 Tailscale 绑定的是特定 IP
- 用 `ss -tlnp | grep 3000` 才能看到具体 IP 上的绑定

### 正确做法

```bash
# 1. 启动 dev server 时指定仅监听 localhost
pnpm exec next dev -p 3000 -H 127.0.0.1

# 2. Tailscale Serve 依然可以代理到 127.0.0.1:3000
tailscale serve --bg --https=3000 3000
```

### 排查命令备忘录

```bash
# 查看端口占用（比 lsof 更可靠）
ss -tlnp | grep 3000

# 查看端口被谁占用
fuser 3000/tcp

# 查看 Tailscale Serve 状态
tailscale serve status

# 重置所有 Tailscale Serve 配置
tailscale serve reset
```

## 影响范围

- 每次需要同时运行 Tailscale Serve + Next.js dev server 时
- 每次运行 e2e 测试时（Playwright webServer 也需要独占 3000 端口）
- **e2e 测试和 Tailscale Serve 不能同时运行**，必须先 `tailscale serve reset` 再跑测试

## 关联

- 关联 integration: `memory/integrations/tailscale-dev-server.md`
- 关联 spec: `specs/search-filter-darkmode.md` §T-2.1.2

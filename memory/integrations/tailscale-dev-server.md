# Tailscale Serve 暴露开发服务器

> 类别: integration
> 创建于: T-1.2.3
> 更新于: T-2.1.2（修正 -H 127.0.0.1）
> 关联文件: 无
> 状态: active

## 概要

`tailscale serve --bg --https=3000 3000` + Next.js `next dev -H 127.0.0.1`。

## 背景

在开发过程中，需要让其他设备（手机、平板）通过外网访问本地 `pnpm dev` 启动的 Next.js 开发服务器进行手动验证。Tailscale Serve 可以将本地端口映射到 tailnet 域名上，提供 HTTPS 访问。

## 内容

### 启动命令（必须指定 -H 127.0.0.1）

```bash
# 1. 启动 Next.js dev server（只监听 localhost，避免与 Tailscale Serve 端口冲突）
pnpm exec next dev -p 3000 -H 127.0.0.1 &

# 2. 暴露到 Tailscale（HTTPS 端口 3000）
tailscale serve --bg --https=3000 3000
```

**为什么要 `-H 127.0.0.1`？** Next.js dev server 默认监听 `::`（所有 IPv6 接口，含 IPv4 映射），会尝试同时绑定所有网络接口的 3000 端口。Tailscale Serve 已占用了 tailnet IP（100.x.x.x）和 tailnet IPv6 地址上的 3000 端口，导致 dev server 启动时 EADDRINUSE。指定 `-H 127.0.0.1` 后 dev server 仅绑定 lo 接口，互不冲突。

### 关闭命令

```bash
# 停止 Tailscale Serve 代理
tailscale serve reset

# 或仅关闭 3000 端口的 serve
tailscale serve --https=3000 off
```

### 查看状态

```bash
tailscale serve status
```

### 访问地址

`https://<hostname>.<tailnet>.ts.net:3000/`，仅限 tailnet 内设备访问。

当前 hostname: `smilezyl-linux.tail123d8e.ts.net`

### 注意事项

- 端口号可自定义，避免与已有 serve 端口冲突
- `--bg` 使其在后台运行，重启后失效（非持久化）
- 如需持久化，使用 `tailscale serve set-config`
- Tailscale Serve 通过本地代理转发到 `127.0.0.1:3000`，不需要 dev server 监听外网
- **若以后修改 tailscale serve 端口，记得同步更新 `-H 127.0.0.1` 对应的 dev server 端口**

## 影响范围

- 开发阶段每轮手动验证时都需要执行
- 不适合生产环境（应直接部署到 Vercel）

## 关联

- 推翻了: 无
- 关联 pitfall: `memory/pitfalls/tailscale-port-conflict.md`
- 关联 spec: `specs/archive/engineering-cleanup/engineering-cleanup.md` §T-1.2.3

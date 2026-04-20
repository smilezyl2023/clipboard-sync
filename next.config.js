/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @vercel/blob 依赖的 undici 使用了 private class fields，
  // 需要 Next 将其作为外部模块，避免 webpack 转译 undici 源码失败
  experimental: {
    serverComponentsExternalPackages: ['@vercel/blob', 'undici'],
  },
}

module.exports = nextConfig

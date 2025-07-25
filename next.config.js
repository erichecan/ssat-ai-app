/** @type {import('next').NextConfig} */
const nextConfig = {
  // 实验性功能
  experimental: {
    // 启用服务器组件优化
    optimizePackageImports: ['lucide-react'],
  },
  
  // 服务器外部包 - 更新于 2024-01-21 00:15:00
  serverExternalPackages: ['pdf-parse'],
  
  // Webpack配置支持pdf-parse
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 确保pdf-parse在服务器端正确工作
      config.externals = config.externals || []
      config.externals.push({
        'pdf-parse': 'commonjs pdf-parse',
      })
    }
    return config
  },
  
  // 图片优化
  images: {
    domains: ['localhost'],
    unoptimized: true, // Netlify兼容性
  },
  
  // 输出配置
  // output: 'standalone', // 注释掉，让Netlify自动处理
  
  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
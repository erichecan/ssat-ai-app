/** @type {import('next').NextConfig} */
const nextConfig = {
  // 图片配置
  images: {
    domains: ['lh3.googleusercontent.com', 'supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  
  // Netlify 部署优化
  trailingSlash: false,
  output: 'standalone',
  
  // 性能优化
  compress: true,
  poweredByHeader: false,
  
  // 环境变量配置
  env: {
    CUSTOM_BUILD_DATE: new Date().toISOString(),
  },
  
  // 服务器外部包配置
  serverExternalPackages: ['pdf-parse'],
  
  // Webpack配置
  webpack: (config, { dev, isServer }) => {
    // 处理PDF解析
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    
    return config
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ]
  },
  
  // API路由配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
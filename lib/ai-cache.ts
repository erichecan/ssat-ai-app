// AI响应缓存系统 - 更新于 2024-01-21 05:00:00
// 用于缓存AI响应，减少重复请求和超时问题

interface CacheEntry {
  response: string
  timestamp: number
  ttl: number
}

interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

class AICache {
  private cache: Map<string, CacheEntry> = new Map()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0
  }
  private readonly maxSize: number = 1000 // 最大缓存条目数
  private readonly defaultTTL: number = 3600000 // 默认1小时TTL

  constructor(maxSize: number = 1000, defaultTTL: number = 3600000) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  // 生成缓存键
  private generateKey(prompt: string, config: any = {}): string {
    const configStr = JSON.stringify(config)
    return `ai_${this.hashString(prompt + configStr)}`
  }

  // 简单的字符串哈希函数
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  // 获取缓存条目
  get(prompt: string, config: any = {}): string | null {
    const key = this.generateKey(prompt, config)
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // 检查是否过期
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    this.stats.hits++
    this.updateHitRate()
    console.log(`AI cache hit for prompt (${prompt.length} chars)`)
    return entry.response
  }

  // 设置缓存条目
  set(prompt: string, response: string, config: any = {}, ttl: number = this.defaultTTL): void {
    const key = this.generateKey(prompt, config)
    
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      ttl
    })

    this.stats.size = this.cache.size
    console.log(`AI cache set for prompt (${prompt.length} chars), cache size: ${this.cache.size}`)
  }

  // 删除最旧的缓存条目
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    // 使用更兼容的迭代方式
    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    })

    if (oldestKey) {
      this.cache.delete(oldestKey)
      console.log('Evicted oldest cache entry')
    }
  }

  // 清理过期条目
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0
    const keysToDelete: string[] = []

    // 先收集要删除的键，避免在迭代过程中修改Map
    this.cache.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        keysToDelete.push(key)
      }
    })

    // 批量删除过期条目
    keysToDelete.forEach(key => {
      this.cache.delete(key)
      cleaned++
    })

    this.stats.size = this.cache.size
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired cache entries`)
    }

    return cleaned
  }

  // 更新命中率
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  // 获取缓存统计信息
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // 清空缓存
  clear(): void {
    this.cache.clear()
    this.stats.size = 0
    console.log('AI cache cleared')
  }

  // 获取缓存大小
  size(): number {
    return this.cache.size
  }
}

// 创建全局缓存实例
export const aiCache = new AICache(1000, 3600000) // 1000条目，1小时TTL

// 定期清理过期条目
setInterval(() => {
  aiCache.cleanup()
}, 300000) // 每5分钟清理一次

// 带缓存的AI文本生成函数
export async function generateTextWithCache(
  prompt: string,
  generateFunction: (prompt: string, timeout?: number, retryConfig?: any, timeoutConfig?: any) => Promise<string>,
  timeout: number = 15000,
  retryConfig: any = {},
  timeoutConfig: any = {},
  cacheTTL: number = 3600000 // 1小时
): Promise<string> {
  // 尝试从缓存获取
  const cacheKey = { timeout, retryConfig, timeoutConfig }
  const cachedResponse = aiCache.get(prompt, cacheKey)
  
  if (cachedResponse) {
    return cachedResponse
  }

  // 缓存未命中，调用AI生成
  console.log('AI cache miss, generating new response...')
  const response = await generateFunction(prompt, timeout, retryConfig, timeoutConfig)
  
  // 缓存响应
  aiCache.set(prompt, response, cacheKey, cacheTTL)
  
  return response
}

// 缓存键生成器（用于不同类型的请求）
export function createCacheKey(type: string, params: any): string {
  return `${type}_${JSON.stringify(params)}`
}

// 导出缓存实例和工具函数
export { AICache } 
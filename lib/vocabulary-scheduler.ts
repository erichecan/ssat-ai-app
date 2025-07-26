// 词汇自动生成调度器
// 每5分钟自动生成词汇直到达到目标数量

let schedulerInterval: NodeJS.Timeout | null = null

export interface SchedulerConfig {
  intervalMinutes: number
  targetWords: number
  batchSize: number
  maxRetries: number
}

export const DEFAULT_CONFIG: SchedulerConfig = {
  intervalMinutes: 5,
  targetWords: 3000,
  batchSize: 5,
  maxRetries: 3
}

export class VocabularyScheduler {
  private config: SchedulerConfig
  private isRunning: boolean = false
  private retryCount: number = 0

  constructor(config: SchedulerConfig = DEFAULT_CONFIG) {
    this.config = config
  }

  async checkAndGenerate(): Promise<boolean> {
    try {
      console.log('🔍 Checking vocabulary count and generating if needed...')
      
      // 调用cron API
      const response = await fetch('/api/cron/vocabulary-auto-gen', {
        method: 'GET'
      })
      
      const result = await response.json()
      
      if (result.success) {
        this.retryCount = 0 // 重置重试计数
        console.log('✅ Vocabulary auto-generation completed:', result.stats)
        
        // 如果达到目标，停止调度器
        if (result.stats?.totalGenerated === 0 && result.stats?.targetRemaining <= 0) {
          console.log('🎯 Target vocabulary count reached, stopping scheduler')
          this.stop()
          return false
        }
        
        return true
      } else {
        console.error('❌ Vocabulary auto-generation failed:', result.error)
        this.retryCount++
        
        // 如果重试次数超过限制，停止调度器
        if (this.retryCount >= this.config.maxRetries) {
          console.error('🛑 Max retries reached, stopping scheduler')
          this.stop()
          return false
        }
        
        return false
      }
    } catch (error) {
      console.error('💥 Scheduler error:', error)
      this.retryCount++
      
      if (this.retryCount >= this.config.maxRetries) {
        console.error('🛑 Max retries reached due to errors, stopping scheduler')
        this.stop()
        return false
      }
      
      return false
    }
  }

  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Scheduler already running')
      return
    }

    console.log(`🚀 Starting vocabulary scheduler (${this.config.intervalMinutes} minutes interval)`)
    this.isRunning = true
    this.retryCount = 0

    // 立即执行一次
    this.checkAndGenerate()

    // 设置定时器
    schedulerInterval = setInterval(() => {
      if (this.isRunning) {
        this.checkAndGenerate()
      }
    }, this.config.intervalMinutes * 60 * 1000)
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler not running')
      return
    }

    console.log('🛑 Stopping vocabulary scheduler')
    this.isRunning = false
    
    if (schedulerInterval) {
      clearInterval(schedulerInterval)
      schedulerInterval = null
    }
  }

  getStatus(): { isRunning: boolean; retryCount: number; config: SchedulerConfig } {
    return {
      isRunning: this.isRunning,
      retryCount: this.retryCount,
      config: this.config
    }
  }
}

// 全局调度器实例
export const vocabularyScheduler = new VocabularyScheduler()

// 浏览器环境下自动启动
if (typeof window !== 'undefined') {
  // 页面加载时启动调度器
  window.addEventListener('load', () => {
    console.log('🌐 Browser detected, starting vocabulary scheduler...')
    vocabularyScheduler.start()
  })
  
  // 页面卸载时停止调度器
  window.addEventListener('beforeunload', () => {
    vocabularyScheduler.stop()
  })
}
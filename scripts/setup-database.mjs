import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupDatabase() {
  console.log('🚀 开始设置数据库...\n')
  
  try {
    // Read the SQL setup script
    const sqlScript = readFileSync(join(__dirname, 'setup-database.sql'), 'utf8')
    
    // Split SQL commands by semicolon and execute them one by one
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📄 找到 ${commands.length} 条SQL命令`)
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      if (command.trim()) {
        console.log(`🔧 执行命令 ${i + 1}/${commands.length}...`)
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: command })
          if (error) {
            console.warn(`⚠️  命令 ${i + 1} 可能已存在或有警告:`, error.message)
          } else {
            console.log(`✅ 命令 ${i + 1} 执行成功`)
          }
        } catch (cmdError) {
          console.warn(`⚠️  命令 ${i + 1} 跳过:`, cmdError.message)
        }
      }
    }
    
    // Test the setup by checking if tables exist
    console.log('\n🔍 验证数据库设置...')
    
    const { data: knowledgeBase, error: kbError } = await supabase
      .from('knowledge_base')
      .select('count(*)')
      .limit(1)
    
    if (kbError) {
      console.error('❌ knowledge_base 表检查失败:', kbError.message)
      // Try alternative approach - direct SQL execution
      console.log('🔄 尝试直接执行SQL命令...')
      
      const { error: directError } = await supabase
        .from('knowledge_base')
        .insert([
          {
            title: 'Test Entry',
            content: 'Test content',
            topic: 'test',
            difficulty: 'easy',
            type: 'concept',
            tags: ['test'],
            source: 'Setup Script'
          }
        ])
      
      if (directError) {
        console.error('❌ 直接插入失败，需要手动设置数据库')
        console.log('\n📋 手动设置说明:')
        console.log('1. 打开 Supabase Dashboard')
        console.log('2. 进入 SQL Editor')
        console.log('3. 复制并运行 scripts/setup-database.sql 文件内容')
        return false
      } else {
        console.log('✅ 数据库设置成功!')
        // Clean up test entry
        await supabase
          .from('knowledge_base')
          .delete()
          .eq('title', 'Test Entry')
      }
    } else {
      console.log('✅ knowledge_base 表检查通过')
    }
    
    console.log('\n🎉 数据库设置完成!')
    return true
    
  } catch (error) {
    console.error('❌ 数据库设置失败:', error.message)
    
    console.log('\n📋 手动设置说明:')
    console.log('1. 打开 Supabase Dashboard: https://supabase.com/dashboard')
    console.log('2. 选择你的项目')
    console.log('3. 进入 SQL Editor')
    console.log('4. 复制并运行 scripts/setup-database.sql 文件内容')
    console.log('5. 运行完成后，重新执行 npm run init-knowledge')
    
    return false
  }
}

// Run the setup
setupDatabase().then(success => {
  if (success) {
    console.log('\n🚀 下一步: 运行 npm run init-knowledge 初始化知识库')
  }
  process.exit(success ? 0 : 1)
})
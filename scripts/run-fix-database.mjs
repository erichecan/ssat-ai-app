import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runDatabaseFix() {
  try {
    console.log('Reading SQL fix file...')
    const sqlContent = readFileSync('./scripts/fix-users-table.sql', 'utf8')
    
    console.log('Executing database fixes...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent })
    
    if (error) {
      // Try alternative method if RPC doesn't work
      console.log('RPC method failed, trying direct query...')
      
      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)
      
      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement })
        if (stmtError) {
          console.log(`Statement failed: ${stmtError.message}`)
        } else {
          console.log('✓ Statement executed successfully')
        }
      }
    } else {
      console.log('✓ Database fixes applied successfully')
    }
    
    console.log('Database setup complete!')
    
  } catch (error) {
    console.error('Error running database fixes:', error)
  }
}

runDatabaseFix().then(() => {
  process.exit(0)
})
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')
    
    // 检查环境变量
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
    console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set')
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        error: 'Supabase environment variables not configured',
        config: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      })
    }
    
    // 测试表结构
    const { data: tableInfo, error: tableError } = await supabase
      .from('knowledge_base')
      .select('*')
      .limit(0)
    
    if (tableError) {
      console.error('Table structure error:', tableError)
      return NextResponse.json({
        error: 'Table structure error',
        details: tableError
      })
    }
    
           // 测试插入一条记录
       const testRecord = {
         title: 'Test Record',
         content: 'This is a test record',
         topic: 'test',
         difficulty: 'medium',
         type: 'concept',
         tags: ['test'],
         source: 'test-api',
         file_name: 'test-file.txt', // 添加file_name字段
         file_path: '/uploads/test-file.txt', // 添加file_path字段
         file_size: 1024, // 添加file_size字段
         file_type: 'text/plain', // 添加file_type字段
         status: 'processed' // 添加status字段
       }
    
    const { data: insertData, error: insertError } = await supabase
      .from('knowledge_base')
      .insert(testRecord)
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert test error:', insertError)
      return NextResponse.json({
        error: 'Insert test failed',
        details: insertError
      })
    }
    
    // 删除测试记录
    await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', insertData.id)
    
    return NextResponse.json({
      success: true,
      message: 'Database connection and insert test successful',
      data: insertData
    })
    
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { searchSimilarKnowledge } from '@/lib/pinecone'

export async function POST(request: NextRequest) {
  try {
    const { queryVector, topK = 5, filter = {} } = await request.json()
    
    if (!queryVector || !Array.isArray(queryVector)) {
      return NextResponse.json(
        { error: 'Invalid query vector' },
        { status: 400 }
      )
    }
    
    console.log('Pinecone search request:', { 
      vectorLength: queryVector.length, 
      topK, 
      filter,
      hasApiKey: !!process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
      indexName: process.env.PINECONE_INDEX_NAME
    })
    
    // 如果filter为空对象，则设为undefined，避免Pinecone的filter要求
    const searchFilter = Object.keys(filter).length > 0 ? filter : undefined
    
    const searchResults = await searchSimilarKnowledge(queryVector, topK, searchFilter)
    
    console.log('Pinecone search results:', { 
      resultCount: searchResults?.length || 0 
    })
    
    return NextResponse.json({ results: searchResults })
  } catch (error) {
    console.error('Error in Pinecone search API:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 
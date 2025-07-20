// Test Pinecone configuration
require('dotenv').config()
const { Pinecone } = require('@pinecone-database/pinecone');

async function testPineconeConfig() {
  console.log('Testing Pinecone configuration...\n');
  
  // Check environment variables
  const apiKey = process.env.PINECONE_API_KEY;
  const environment = process.env.PINECONE_ENVIRONMENT;
  const indexName = process.env.PINECONE_INDEX_NAME;
  
  if (!apiKey) {
    console.error('❌ PINECONE_API_KEY not found in environment variables');
    return false;
  }
  
  if (!environment) {
    console.error('❌ PINECONE_ENVIRONMENT not found in environment variables');
    return false;
  }
  
  if (!indexName) {
    console.error('❌ PINECONE_INDEX_NAME not found in environment variables');
    return false;
  }
  
  console.log('✅ Environment variables found:');
  console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Index Name: ${indexName}\n`);
  
  try {
    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: apiKey,
    });
    
    console.log('✅ Pinecone client initialized successfully');
    
    // Test index connection
    const index = pinecone.index(indexName);
    console.log('✅ Index connection established');
    
    // Get index stats
    const stats = await index.describeIndexStats();
    console.log('✅ Index stats retrieved:');
    console.log(`   Total vectors: ${stats.totalVectorCount || 0}`);
    console.log(`   Index fullness: ${stats.indexFullness || 0}`);
    console.log(`   Dimension: ${stats.dimension || 'Unknown'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Pinecone configuration test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('Invalid API key')) {
      console.error('   → Check your PINECONE_API_KEY');
    } else if (error.message.includes('not found')) {
      console.error('   → Check your PINECONE_INDEX_NAME');
    } else if (error.message.includes('environment')) {
      console.error('   → Check your PINECONE_ENVIRONMENT');
    }
    
    return false;
  }
}

// Run the test
testPineconeConfig().then((success) => {
  if (success) {
    console.log('\n🎉 Pinecone configuration is working correctly!');
  } else {
    console.log('\n❌ Pinecone configuration needs to be fixed.');
    console.log('Please check the PINECONE_SETUP.md file for detailed instructions.');
  }
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
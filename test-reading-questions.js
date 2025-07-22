// 测试阅读问题生成API
const testReadingQuestionsAPI = async () => {
  console.log('Testing Reading Questions API...');
  
  const testMaterial = {
    title: "Quantum Computing Fundamentals",
    content: "Quantum computing represents a paradigmatic shift from classical computational models, leveraging quantum mechanical phenomena such as superposition and entanglement to process information. Unlike classical bits that exist in definitive states of 0 or 1, quantum bits (qubits) can exist in multiple states simultaneously, enabling exponentially greater computational possibilities for specific algorithmic problems. Scientists and researchers are working to overcome the significant technical challenges in building stable quantum computers.",
    difficulty: "hard",
    wordCount: 142,
    estimatedReadingTime: 3,
    source: "ai_generated",
    topic: "Quantum Physics"
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/reading-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        material: testMaterial,
        questionCount: 5
      })
    });
    
    const data = await response.json();
    console.log('API Response Status:', response.status);
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.questions) {
      console.log('✅ Reading Questions API 工作正常');
      console.log(`Generated ${data.questions.length} questions`);
      console.log(`Is Fallback: ${data.isFallback || false}`);
      
      // 检查问题质量
      data.questions.forEach((q, i) => {
        console.log(`\nQuestion ${i+1}:`);
        console.log(`Title: ${q.question}`);
        console.log(`Type: ${q.type}`);
        console.log(`Options: ${q.options?.length || 0}`);
        console.log(`Has explanation: ${!!q.explanation}`);
        
        // 检查是否与材料相关
        if (q.question.toLowerCase().includes('quantum') || 
            q.question.includes(testMaterial.title) ||
            q.explanation?.toLowerCase().includes('quantum')) {
          console.log('✅ Question related to reading material');
        } else {
          console.log('⚠️  Question may not be closely related to material');
        }
      });
    } else {
      console.log('❌ Reading Questions API 失败');
      console.log('Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ API请求失败:', error.message);
  }
};

// 运行测试
testReadingQuestionsAPI();
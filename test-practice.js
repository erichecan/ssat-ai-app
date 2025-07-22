// 测试practice页面修复效果
const testPracticeAPI = async () => {
  console.log('测试Practice API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '12345678-1234-1234-1234-123456789012',
        sessionType: 'adaptive',
        subjects: ['all'],
        difficulty: 'medium',
        questionCount: 10
      })
    });
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.session) {
      console.log('✅ Practice API 工作正常');
      console.log(`Session ID: ${data.session.id}`);
      console.log(`Questions count: ${data.questions?.length || 0}`);
    } else {
      console.log('❌ Practice API 失败');
    }
    
  } catch (error) {
    console.error('❌ API请求失败:', error);
  }
};

// 运行测试
testPracticeAPI();
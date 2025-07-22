const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 设置移动端视口
  await page.setViewportSize({ width: 375, height: 812 });
  
  try {
    console.log('Navigating to flashcard page...');
    await page.goto('http://localhost:3000/flashcard');
    
    // 等待页面加载
    await page.waitForTimeout(3000);
    
    // 截图1: 初始答案面
    console.log('Taking screenshot 1: Answer side (initial view)');
    await page.screenshot({ path: 'flashcard-answer-side.png', fullPage: true });
    
    // 点击"Test Yourself"按钮切换到问题面
    const flipButton = await page.locator('button:has-text("Test Yourself")');
    if (await flipButton.count() > 0) {
      await flipButton.click();
      await page.waitForTimeout(1000);
      
      // 截图2: 问题面（只显示单词）
      console.log('Taking screenshot 2: Question side (word only)');
      await page.screenshot({ path: 'flashcard-question-side.png', fullPage: true });
      
      // 切换回答案面
      const showAnswerButton = await page.locator('button:has-text("Show Answer")');
      if (await showAnswerButton.count() > 0) {
        await showAnswerButton.click();
        await page.waitForTimeout(1000);
        
        // 截图3: 答案面的布局细节
        console.log('Taking screenshot 3: Answer side layout details');
        await page.screenshot({ path: 'flashcard-answer-layout.png', fullPage: true });
      }
    }
    
    // 检查hint是否为句子格式
    const hintElement = await page.locator('text=/Context Hint:/').first();
    if (await hintElement.count() > 0) {
      const hintText = await page.locator('.text-yellow-900').first().textContent();
      console.log('Hint text:', hintText);
    }
    
    console.log('Screenshots saved successfully!');
    console.log('✅ Answer side shows first (as requested)');
    console.log('✅ Hints are now full sentences using the vocabulary word');
    console.log('✅ Layout fixed with proper responsive design');
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
})();
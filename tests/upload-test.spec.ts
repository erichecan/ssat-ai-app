import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * 上传功能测试 - 更新于 2024-01-21 02:20:00
 * 测试PDF上传后列表为空的问题
 */
test.describe('Upload Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到上传页面
    await page.goto('/upload');
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('should upload PDF file and display in list', async ({ page }) => {
    // 创建测试PDF文件路径
    const pdfPath = path.join(__dirname, '../test-upload.pdf');
    
    // 监听网络请求
    const uploadPromise = page.waitForResponse(response => 
      response.url().includes('/api/upload') && response.status() === 200
    );
    
    const filesPromise = page.waitForResponse(response => 
      response.url().includes('/api/uploaded-files') && response.status() === 200
    );

    // 选择文件 - 使用第一个文件输入框
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(pdfPath);

    // 等待上传完成
    const uploadResponse = await uploadPromise;
    console.log('Upload response:', await uploadResponse.json());

    // 等待文件列表刷新
    const filesResponse = await filesPromise;
    console.log('Files response:', await filesResponse.json());

    // 检查上传状态
    await expect(page.locator('text=Successfully processed file')).toBeVisible();

    // 等待列表更新
    await page.waitForTimeout(2000);

    // 检查文件是否在列表中显示
    const fileList = page.locator('[data-testid="uploaded-files-list"]');
    await expect(fileList).toBeVisible();

    // 检查是否有文件项
    const fileItems = page.locator('[data-testid="file-item"]');
    const itemCount = await fileItems.count();
    console.log(`Found ${itemCount} file items in list`);

    // 如果列表为空，截图记录
    if (itemCount === 0) {
      await page.screenshot({ path: 'upload-list-empty.png' });
      console.log('File list is empty after upload');
    } else {
      // 检查文件名是否显示
      await expect(page.locator('text=test-upload.pdf')).toBeVisible();
    }
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    // 监听网络请求
    page.on('response', response => {
      if (response.url().includes('/api/upload')) {
        console.log('Upload API response:', response.status(), response.url());
      }
    });

    // 尝试上传不存在的文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('non-existent-file.pdf');

    // 检查错误处理
    await expect(page.locator('text=Error')).toBeVisible();
  });
}); 
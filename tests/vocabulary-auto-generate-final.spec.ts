import { test, expect } from '@playwright/test';

/**
 * Final Vocabulary Auto-Generation API Tests
 * Optimized for the actual API behavior and performance characteristics
 */
test.describe('Vocabulary Auto-Generation API - Production Tests', () => {
  const API_ENDPOINT = '/api/vocabulary/auto-generate';

  test.describe('GET /api/vocabulary/auto-generate', () => {
    test('should return auto-generation service status', async ({ request }) => {
      const response = await request.get(API_ENDPOINT);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      // Verify response structure
      expect(data).toHaveProperty('message', 'Auto-generation service is active');
      expect(data).toHaveProperty('interval', '5 minutes');
      expect(data).toHaveProperty('target', 3000);
      expect(data).toHaveProperty('batchSize', 5);
      expect(data).toHaveProperty('currentStatus');
      expect(data).toHaveProperty('lastCheck');
      
      // Verify currentStatus structure
      expect(data.currentStatus).toHaveProperty('totalWords');
      expect(data.currentStatus).toHaveProperty('targetRemaining');
      
      // Verify data types and constraints
      expect(typeof data.currentStatus.totalWords).toBe('number');
      expect(typeof data.currentStatus.targetRemaining).toBe('number');
      expect(data.currentStatus.totalWords).toBeGreaterThanOrEqual(0);
      expect(data.currentStatus.targetRemaining).toBeGreaterThanOrEqual(0);
      expect(data.currentStatus.totalWords + data.currentStatus.targetRemaining).toBe(3000);
      
      // Verify lastCheck is a valid ISO string
      expect(() => new Date(data.lastCheck)).not.toThrow();
      expect(new Date(data.lastCheck).getTime()).toBeLessThanOrEqual(Date.now());
      
      console.log('✅ Auto-generation status verified:', {
        totalWords: data.currentStatus.totalWords,
        targetRemaining: data.currentStatus.targetRemaining,
        progressPercentage: Math.round((data.currentStatus.totalWords / 3000) * 100)
      });
    });

    test('should handle concurrent GET requests efficiently', async ({ request }) => {
      const promises = Array.from({ length: 5 }, () => request.get(API_ENDPOINT));
      const responses = await Promise.all(promises);
      
      // All requests should complete successfully
      for (const response of responses) {
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('currentStatus');
      }
      
      console.log('✅ Concurrent GET requests handled successfully');
    });
  });

  test.describe('POST /api/vocabulary/auto-generate', () => {
    test('should trigger vocabulary auto-generation with extended timeout', async ({ request }) => {
      // Extended timeout for POST requests that actually generate vocabulary
      test.setTimeout(120000); // 2 minutes
      
      const startTime = Date.now();
      const response = await request.post(API_ENDPOINT, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 90000 // 90 seconds API timeout
      });
      
      const duration = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      // Verify successful generation response
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
      expect(data.message).toMatch(/Auto-generated \d+ new words/);
      expect(data).toHaveProperty('stats');
      
      // Verify stats structure
      expect(data.stats).toHaveProperty('batchesProcessed');
      expect(data.stats).toHaveProperty('successfulBatches');
      expect(data.stats).toHaveProperty('totalGenerated');
      expect(data.stats).toHaveProperty('existingWords');
      expect(data.stats).toHaveProperty('newTotal');
      expect(data.stats).toHaveProperty('targetRemaining');
      
      // Verify data consistency
      expect(data.stats.totalGenerated).toBeGreaterThanOrEqual(0);
      expect(data.stats.existingWords).toBeGreaterThanOrEqual(0);
      expect(data.stats.newTotal).toBe(data.stats.existingWords + data.stats.totalGenerated);
      expect(data.stats.targetRemaining).toBe(3000 - data.stats.newTotal);
      
      console.log('✅ Vocabulary generation completed:', {
        generated: data.stats.totalGenerated,
        duration: `${Math.round(duration / 1000)}s`,
        newTotal: data.stats.newTotal,
        remaining: data.stats.targetRemaining
      });
    });

    test('should generate vocabulary efficiently', async ({ request }) => {
      test.setTimeout(120000); // 2 minutes
      
      // Get current state before generation
      const beforeResponse = await request.get(API_ENDPOINT);
      const beforeData = await beforeResponse.json();
      const wordsBefore = beforeData.currentStatus.totalWords;
      
      // Trigger generation
      const generateResponse = await request.post(API_ENDPOINT, {
        timeout: 90000
      });
      
      expect(generateResponse.status()).toBe(200);
      const generateData = await generateResponse.json();
      
      // Get state after generation
      const afterResponse = await request.get(API_ENDPOINT);
      const afterData = await afterResponse.json();
      const wordsAfter = afterData.currentStatus.totalWords;
      
      // Verify words were actually generated
      const actualGenerated = wordsAfter - wordsBefore;
      expect(actualGenerated).toBeGreaterThan(0);
      expect(actualGenerated).toBe(generateData.stats.totalGenerated);
      
      console.log('✅ Vocabulary generation efficiency verified:', {
        before: wordsBefore,
        after: wordsAfter,
        generated: actualGenerated
      });
    });
  });

  test.describe('API Integration & Performance', () => {
    test('should handle API response headers correctly', async ({ request }) => {
      const response = await request.get(API_ENDPOINT);
      
      // Verify CORS headers
      expect(response.headers()['access-control-allow-origin']).toBe('*');
      expect(response.headers()['access-control-allow-methods']).toContain('GET');
      expect(response.headers()['access-control-allow-methods']).toContain('POST');
      
      // Verify content type
      expect(response.headers()['content-type']).toContain('application/json');
      
      console.log('✅ API headers verified correctly');
    });

    test('should maintain consistent API behavior', async ({ request }) => {
      // Test multiple GET requests to ensure consistency
      const responses = await Promise.all([
        request.get(API_ENDPOINT),
        request.get(API_ENDPOINT),
        request.get(API_ENDPOINT)
      ]);
      
      const data = await Promise.all(responses.map(r => r.json()));
      
      // All responses should have the same structure
      for (const item of data) {
        expect(item).toHaveProperty('target', 3000);
        expect(item).toHaveProperty('batchSize', 5);
        expect(item).toHaveProperty('interval', '5 minutes');
      }
      
      // Total words should be consistent across all responses (within a small window)
      const totalWords = data.map(d => d.currentStatus.totalWords);
      const minWords = Math.min(...totalWords);
      const maxWords = Math.max(...totalWords);
      
      // Allow small differences due to concurrent generation
      expect(maxWords - minWords).toBeLessThanOrEqual(50);
      
      console.log('✅ API consistency verified:', {
        wordCounts: totalWords,
        variation: maxWords - minWords
      });
    });

    test('should track progress toward target accurately', async ({ request }) => {
      const response = await request.get(API_ENDPOINT);
      const data = await response.json();
      
      const { totalWords, targetRemaining } = data.currentStatus;
      const progressPercentage = Math.round((totalWords / 3000) * 100);
      
      // Verify progress calculations
      expect(totalWords + targetRemaining).toBe(3000);
      expect(progressPercentage).toBeGreaterThanOrEqual(0);
      expect(progressPercentage).toBeLessThanOrEqual(100);
      
      console.log('✅ Progress tracking verified:', {
        current: totalWords,
        target: 3000,
        remaining: targetRemaining,
        progress: `${progressPercentage}%`
      });
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('should handle rapid successive requests gracefully', async ({ request }) => {
      // Test rapid GET requests
      const promises = Array.from({ length: 10 }, (_, i) => 
        request.get(API_ENDPOINT).then(r => ({ index: i, status: r.status() }))
      );
      
      const results = await Promise.all(promises);
      
      // All requests should succeed
      for (const result of results) {
        expect(result.status).toBe(200);
      }
      
      console.log('✅ Rapid successive requests handled gracefully');
    });

    test('should maintain API availability during load', async ({ request }) => {
      // Simulate moderate load
      const batchSize = 3;
      const batches = 2;
      
      for (let batch = 0; batch < batches; batch++) {
        const promises = Array.from({ length: batchSize }, () => 
          request.get(API_ENDPOINT)
        );
        
        const responses = await Promise.all(promises);
        
        // All responses in this batch should be successful
        for (const response of responses) {
          expect(response.status()).toBe(200);
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('✅ API maintained availability during load testing');
    });
  });
});
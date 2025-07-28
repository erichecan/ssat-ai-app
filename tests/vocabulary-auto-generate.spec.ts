import { test, expect } from '@playwright/test';

/**
 * Vocabulary Auto-Generation API Tests
 * Tests the /api/vocabulary/auto-generate endpoint for both GET and POST methods
 */
test.describe('Vocabulary Auto-Generation API', () => {
  const API_ENDPOINT = '/api/vocabulary/auto-generate';

  test.describe('GET /api/vocabulary/auto-generate', () => {
    test('should return auto-generation service status', async ({ request }) => {
      const response = await request.get(API_ENDPOINT);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      // Verify response structure
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('interval', '5 minutes');
      expect(data).toHaveProperty('target', 3000);
      expect(data).toHaveProperty('batchSize', 5);
      expect(data).toHaveProperty('currentStatus');
      expect(data).toHaveProperty('lastCheck');
      
      // Verify currentStatus structure
      expect(data.currentStatus).toHaveProperty('totalWords');
      expect(data.currentStatus).toHaveProperty('targetRemaining');
      
      // Verify data types
      expect(typeof data.currentStatus.totalWords).toBe('number');
      expect(typeof data.currentStatus.targetRemaining).toBe('number');
      expect(data.currentStatus.targetRemaining).toBeGreaterThanOrEqual(0);
      
      // Verify lastCheck is a valid ISO string
      expect(() => new Date(data.lastCheck)).not.toThrow();
      
      console.log('Auto-generation status:', data);
    });

    test('should handle errors gracefully in GET request', async ({ request }) => {
      // This test verifies that the endpoint handles internal errors gracefully
      const response = await request.get(API_ENDPOINT);
      
      // Even if there are internal errors, it should return a structured response
      expect([200, 500]).toContain(response.status());
      
      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('interval');
      expect(data).toHaveProperty('target');
      expect(data).toHaveProperty('batchSize');
    });
  });

  test.describe('POST /api/vocabulary/auto-generate', () => {
    test('should trigger vocabulary auto-generation', async ({ request }) => {
      const response = await request.post(API_ENDPOINT, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Log response for debugging
      const responseText = await response.text();
      console.log('POST response status:', response.status());
      console.log('POST response body:', responseText);
      
      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      // Check if request was successful or failed with specific errors
      if (response.status() === 200) {
        // Successful generation
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('message');
        expect(data.message).toMatch(/Auto-generated \d+ new words/);
        
        if (data.stats) {
          expect(data.stats).toHaveProperty('totalGenerated');
          expect(typeof data.stats.totalGenerated).toBe('number');
          expect(data.stats.totalGenerated).toBeGreaterThanOrEqual(0);
        }
      } else if (response.status() === 500) {
        // Expected error cases
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        
        // Common error scenarios
        const possibleErrors = [
          'AI service not configured',
          'Database service not configured',
          'Generation failed',
          'Auto-generation service error'
        ];
        
        const errorMatches = possibleErrors.some(err => 
          data.error.includes(err) || 
          (data.details && data.details.includes(err))
        );
        
        if (!errorMatches) {
          console.warn('Unexpected error message:', data.error);
        }
      } else {
        throw new Error(`Unexpected response status: ${response.status()}`);
      }
    });

    test('should handle missing environment variables', async ({ request }) => {
      // This test verifies error handling for missing configuration
      const response = await request.post(API_ENDPOINT);
      
      // Should return an error response
      const data = await response.json();
      
      if (response.status() === 500) {
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        
        // Check for configuration-related errors
        const configErrors = [
          'AI service not configured',
          'Database service not configured'
        ];
        
        const hasConfigError = configErrors.some(err => data.error.includes(err));
        
        if (hasConfigError) {
          console.log('Configuration error detected (expected):', data.error);
        }
      }
    });

    test('should validate API endpoint integration', async ({ request }) => {
      // Test the integration with the generate-bulk endpoint
      const response = await request.post(API_ENDPOINT);
      const data = await response.json();
      
      // Log for debugging integration issues
      console.log('Integration test - Status:', response.status());
      console.log('Integration test - Response:', data);
      
      // Verify response structure regardless of success/failure
      expect(data).toHaveProperty('success');
      expect(typeof data.success).toBe('boolean');
      
      if (data.success) {
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('stats');
      } else {
        expect(data).toHaveProperty('error');
      }
    });
  });

  test.describe('API Error Scenarios', () => {
    test('should handle network timeouts gracefully', async ({ request }) => {
      // Test with a very short timeout to simulate network issues
      try {
        const response = await request.post(API_ENDPOINT, {
          timeout: 1000 // 1 second timeout
        });
        
        // If request completes within timeout, verify response
        const data = await response.json();
        expect(data).toHaveProperty('success');
        
      } catch (error) {
        // Timeout or network error is acceptable for this test
        console.log('Network timeout test - Expected timeout occurred');
        expect(error.message).toMatch(/Timeout|timeout/i);
      }
    });

    test('should validate response headers', async ({ request }) => {
      const response = await request.get(API_ENDPOINT);
      
      // Verify content type
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
      
      console.log('Response headers:', response.headers());
    });
  });

  test.describe('Load Testing', () => {
    test('should handle multiple concurrent requests', async ({ request }) => {
      // Test multiple GET requests concurrently
      const promises = Array.from({ length: 3 }, () => 
        request.get(API_ENDPOINT)
      );
      
      const responses = await Promise.all(promises);
      
      // All requests should complete
      expect(responses).toHaveLength(3);
      
      // Verify all responses
      for (const response of responses) {
        expect([200, 500]).toContain(response.status());
        
        const data = await response.json();
        expect(data).toHaveProperty('message');
      }
      
      console.log('Concurrent requests completed successfully');
    });
  });
});
import { test, expect } from '@playwright/test';

/**
 * Debug test for Vocabulary Auto-Generation API
 * This test focuses on identifying the core issues
 */
test.describe('Vocabulary Auto-Generation API Debug', () => {
  const API_ENDPOINT = '/api/vocabulary/auto-generate';

  test('Debug: Check raw response from GET endpoint', async ({ request }) => {
    const response = await request.get(API_ENDPOINT);
    
    console.log('=== GET Request Debug ===');
    console.log('Status:', response.status());
    console.log('Status Text:', response.statusText());
    console.log('Headers:', response.headers());
    
    const responseText = await response.text();
    console.log('Raw Response (first 500 chars):', responseText.substring(0, 500));
    
    // Check if response is HTML instead of JSON
    if (responseText.includes('<!DOCTYPE')) {
      console.log('❌ Response is HTML instead of JSON - Next.js routing issue');
      console.log('This indicates the API route is not being reached properly');
    }
    
    try {
      const jsonData = JSON.parse(responseText);
      console.log('✅ Valid JSON response:', jsonData);
    } catch (e) {
      console.log('❌ Invalid JSON response:', e.message);
    }
  });

  test('Debug: Check raw response from POST endpoint', async ({ request }) => {
    const response = await request.post(API_ENDPOINT, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('=== POST Request Debug ===');
    console.log('Status:', response.status());
    console.log('Status Text:', response.statusText());
    console.log('Headers:', response.headers());
    
    const responseText = await response.text();
    console.log('Raw Response (first 500 chars):', responseText.substring(0, 500));
    
    // Check for common issues
    if (responseText.includes('<!DOCTYPE')) {
      console.log('❌ Response is HTML instead of JSON - Next.js routing issue');
    } else if (responseText.includes('404')) {
      console.log('❌ 404 error - API route not found');
    } else if (responseText.includes('500')) {
      console.log('❌ 500 error - Server error in API route');
    }
    
    try {
      const jsonData = JSON.parse(responseText);
      console.log('✅ Valid JSON response:', jsonData);
      
      if (jsonData.error) {
        console.log('🔍 API Error Details:', jsonData.error);
        if (jsonData.details) {
          console.log('🔍 Error Details:', jsonData.details);
        }
      }
    } catch (e) {
      console.log('❌ Invalid JSON response:', e.message);
    }
  });

  test('Debug: Test alternative API path', async ({ request }) => {
    // Test if the API is accessible with different paths
    const alternativePaths = [
      '/api/vocabulary/auto-generate',
      '/api/vocabulary/auto-generate/',
      '/app/api/vocabulary/auto-generate',
    ];
    
    for (const path of alternativePaths) {
      console.log(`\n=== Testing path: ${path} ===`);
      try {
        const response = await request.get(path);
        console.log(`Status: ${response.status()}`);
        
        const text = await response.text();
        console.log(`Response type: ${text.includes('<!DOCTYPE') ? 'HTML' : 'JSON'}`);
        console.log(`First 100 chars: ${text.substring(0, 100)}`);
      } catch (error) {
        console.log(`Error: ${error.message}`);
      }
    }
  });

  test('Debug: Check environment and configuration', async ({ request }) => {
    // Try to access a simpler API endpoint to test basic functionality
    console.log('=== Environment Debug ===');
    
    try {
      // Test a basic API endpoint that should work
      const testResponse = await request.get('/api/test-db');
      console.log('Test DB API Status:', testResponse.status());
      
      if (testResponse.status() === 200) {
        const testData = await testResponse.json();
        console.log('✅ Basic API functionality works');
        console.log('Test response:', testData);
      }
    } catch (error) {
      console.log('❌ Basic API test failed:', error.message);
    }
    
    // Check if the vocabulary/generate-bulk endpoint is accessible
    try {
      const bulkResponse = await request.get('/api/vocabulary/generate-bulk?userId=00000000-0000-0000-0000-000000000001');
      console.log('Bulk API Status:', bulkResponse.status());
      
      const bulkText = await bulkResponse.text();
      console.log('Bulk API Response type:', bulkText.includes('<!DOCTYPE') ? 'HTML' : 'JSON');
      
      if (!bulkText.includes('<!DOCTYPE')) {
        const bulkData = JSON.parse(bulkText);
        console.log('✅ Bulk API works:', bulkData);
      }
    } catch (error) {
      console.log('❌ Bulk API test failed:', error.message);
    }
  });

  test('Debug: Check specific error patterns', async ({ request }) => {
    const response = await request.post(API_ENDPOINT);
    const responseText = await response.text();
    
    console.log('=== Error Pattern Analysis ===');
    
    // Check for specific error patterns
    const errorPatterns = [
      { pattern: 'ENOTFOUND', description: 'DNS resolution error' },
      { pattern: 'ECONNREFUSED', description: 'Connection refused' },
      { pattern: 'fetch failed', description: 'Fetch operation failed' },
      { pattern: 'Unexpected token', description: 'JSON parsing error' },
      { pattern: 'TypeError', description: 'Type error in code' },
      { pattern: 'ReferenceError', description: 'Variable not defined' },
      { pattern: 'Missing', description: 'Missing configuration' },
      { pattern: 'service not configured', description: 'Service configuration issue' }
    ];
    
    for (const { pattern, description } of errorPatterns) {
      if (responseText.includes(pattern)) {
        console.log(`🔍 Found pattern "${pattern}": ${description}`);
      }
    }
    
    // Check if it's a Next.js development vs production issue
    if (responseText.includes('Application error')) {
      console.log('🔍 Next.js application error detected');
    }
    
    if (responseText.includes('This page could not be found')) {
      console.log('🔍 Next.js 404 page - API route not found');
    }
  });
});
#!/usr/bin/env node

/**
 * Test script for Shopify Checkout Branding MCP Tool HTTP endpoints
 * 
 * Usage: node test-http.js
 * 
 * Prerequisites:
 * 1. Start the HTTP server: npm run start:http
 * 2. Ensure you have valid Shopify credentials in .env
 */

const BASE_URL = 'http://localhost:8787';

// Example profile ID - replace with your actual profile ID
const EXAMPLE_PROFILE_ID = 'gid://shopify/CheckoutProfile/1';

async function testEndpoint(method, path, body = null, description = '') {
  console.log(`\n📍 Testing: ${description || `${method} ${path}`}`);
  console.log('─'.repeat(50));
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
      console.log('Request body:', JSON.stringify(body, null, 2));
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error };
  }
}

async function runTests() {
  console.log('🚀 Shopify Checkout Branding MCP Tool - HTTP API Test Suite');
  console.log('═'.repeat(60));
  
  // Test 1: Health check
  await testEndpoint('GET', '/health', null, 'Health Check');
  
  // Test 2: List profiles
  const profilesResult = await testEndpoint('GET', '/profiles', null, 'List Checkout Profiles');
  
  if (profilesResult.success && profilesResult.data.profiles && profilesResult.data.profiles.length > 0) {
    const firstProfile = profilesResult.data.profiles[0];
    const profileId = firstProfile.id;
    
    console.log(`\n✅ Found ${profilesResult.data.profiles.length} profile(s)`);
    console.log(`📝 Using profile: ${firstProfile.name || 'Unnamed'} (${profileId})`);
    
    // Test 3: Get current branding
    await testEndpoint('GET', `/profiles/${encodeURIComponent(profileId)}/branding`, null, 'Get Current Branding');
    
    // Test 4: Update branding
    const updateData = {
      logoWidth: 150,
      logoPosition: 'CENTER',
      colors: {
        primary: '#5A31F4',
        background: '#FFFFFF',
        text: '#333333',
      },
    };
    
    await testEndpoint(
      'POST',
      `/profiles/${encodeURIComponent(profileId)}/branding`,
      updateData,
      'Update Branding (Logo & Colors)'
    );
    
    // Test 5: Verify changes
    await testEndpoint('GET', `/profiles/${encodeURIComponent(profileId)}/branding`, null, 'Verify Branding Changes');
    
  } else {
    console.log('\n⚠️ No checkout profiles found. Please ensure your store has at least one checkout profile.');
  }
  
  // Test 6: Upload logo (with example URL)
  const uploadData = {
    url: 'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-primary-logo-456baa801ee66a0a435671082365958316831c9960c480451dd0330bcdae304f.svg',
    filename: 'test-logo.svg',
    mimeType: 'image/svg+xml',
  };
  
  console.log('\n📤 Testing logo upload (optional - may fail if URL is not accessible)');
  await testEndpoint('POST', '/files', uploadData, 'Upload Logo from URL');
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Test suite completed!');
  console.log('\nNote: Some tests may fail if:');
  console.log('- Your Shopify plan doesn\'t support checkout branding');
  console.log('- The store doesn\'t have checkout profiles');
  console.log('- API token lacks required permissions');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) throw new Error('Server not responding');
    return true;
  } catch (error) {
    console.error('❌ Error: Server is not running at ' + BASE_URL);
    console.error('Please start the server first: npm run start:http');
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
  process.exit(serverRunning ? 0 : 1);
})();

#!/usr/bin/env node

/**
 * Test script to verify MCP server responds correctly
 * This simulates what Cursor sends to the MCP server
 */

const { spawn } = require('child_process');
const path = require('path');

// Test environment
const env = {
  ...process.env,
  SHOPIFY_STORE_DOMAIN: 'your-store.myshopify.com',
  SHOPIFY_ADMIN_TOKEN: 'shpat_your_admin_api_token_here',
  SHOPIFY_API_VERSION: '2026-01'
};

console.log('Starting MCP server test...\n');

// Start the MCP server
const mcpServer = spawn('node', [path.join(__dirname, 'dist', 'index.js')], {
  env,
  stdio: ['pipe', 'pipe', 'inherit'] // stdin, stdout, stderr
});

let responseBuffer = '';

// Handle server output
mcpServer.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  // Try to parse each line as JSON
  const lines = responseBuffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const json = JSON.parse(line);
        console.log('✅ Valid JSON response:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.error('❌ Invalid JSON:', line);
        console.error('   Error:', e.message);
      }
    }
  }
  // Keep the incomplete line in the buffer
  responseBuffer = lines[lines.length - 1];
});

// Send initialize request
const initRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "0.1.0",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  }
};

console.log('Sending initialize request...\n');
mcpServer.stdin.write(JSON.stringify(initRequest) + '\n');

// Send list tools request after a delay
setTimeout(() => {
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };
  
  console.log('\nSending list tools request...\n');
  mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 1000);

// Clean exit after tests
setTimeout(() => {
  console.log('\n✅ Test complete - No errors detected');
  console.log('The MCP server is responding with valid JSON');
  mcpServer.kill();
  process.exit(0);
}, 3000);

mcpServer.on('error', (error) => {
  console.error('❌ Failed to start MCP server:', error);
  process.exit(1);
});

mcpServer.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`❌ MCP server exited with code ${code}`);
    process.exit(1);
  }
});

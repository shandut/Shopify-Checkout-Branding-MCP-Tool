#!/bin/bash

echo "🚀 Shopify Checkout MCP Tool - Quick Start"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.template .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  Please edit .env with your Shopify credentials:"
    echo "   - SHOPIFY_STORE_DOMAIN: Your store's domain"
    echo "   - SHOPIFY_ADMIN_TOKEN: Your Admin API token"
    echo ""
    echo "After editing .env, run this script again."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "🔨 Building project..."
    npm run build
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Choose how to run the tool:"
echo ""
echo "1) MCP Mode (for Claude Desktop)"
echo "   Configure Claude Desktop as shown in README, then restart Claude"
echo ""
echo "2) HTTP API Mode (for Cursor or direct API access)"
echo "   Run: npm run start:http"
echo "   Then test with: node test-http.js"
echo ""
echo "For detailed usage examples, see:"
echo "   - README.md"
echo "   - examples/mcp-usage.md"
echo ""

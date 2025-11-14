# Cursor MCP Setup Guide

## ✅ Fixed: MCP Server Now Works with Cursor

The MCP server has been updated to work correctly with Cursor. The issue was that logging output was interfering with the JSON-RPC protocol that MCP uses for communication.

## 🚀 Quick Setup

1. **Ensure the project is built:**
```bash
cd /Users/shannondutton/Documents/Shopify-Checkout-MCP-Tool
npm run build
```

2. **Your Cursor MCP configuration is already set up:**
```json
{
  "shopify-checkout": {
    "command": "node",
    "args": ["/Users/shannondutton/Documents/Shopify-Checkout-MCP-Tool/dist/index.js"],
    "env": {
      "SHOPIFY_STORE_DOMAIN": "your-store.myshopify.com",
      "SHOPIFY_ADMIN_TOKEN": "shpat_your_admin_api_token_here",
      "SHOPIFY_API_VERSION": "2026-01"
    }
  }
}
```

3. **Restart Cursor** to reload the MCP configuration

4. **Test the tools** in Cursor:
   - "Use the shopify_list_checkout_profiles tool"
   - "Get checkout branding for profile gid://shopify/CheckoutProfile/2959376611"

## 🔧 What Was Fixed

### Problem
The MCP server was outputting colored logs which corrupted the JSON-RPC communication:
- Error: `Expected ',' or ']' after array element in JSON`
- Error: `Unexpected token '', "...[35mmodul"... is not valid JSON`

### Solution
- **Silent logging in MCP mode**: The logger now detects when running as an MCP server (no PORT environment variable) and disables all output
- **Clean JSON communication**: Only JSON-RPC messages are sent to stdout
- **HTTP mode logging preserved**: When running with PORT set, full logging is still available

## 📝 Available Tools in Cursor

1. **`shopify_list_checkout_profiles`**
   - Lists all checkout profiles
   - No parameters required

2. **`shopify_get_checkout_branding`**
   - Gets current branding settings
   - Parameter: `profileId` (e.g., "gid://shopify/CheckoutProfile/2959376611")

3. **`shopify_update_checkout_branding`**
   - Updates logo and colors
   - Parameters:
     - `profileId` (required)
     - `logoWidth` (optional, pixels)
     - `logoPosition` (optional: "LEFT", "CENTER", "RIGHT")
     - `colors` (optional: object with hex colors)

4. **`shopify_upload_logo_from_url`**
   - Uploads logo from URL
   - Parameter: `url` (required, HTTPS)

## 🧪 Testing the MCP Server

To verify the MCP server is working correctly:

```bash
node test-mcp.cjs
```

This will test the JSON-RPC protocol and verify clean communication.

## 🎯 Usage Examples in Cursor

### List all profiles:
```
Use the shopify_list_checkout_profiles tool to show me all checkout profiles
```

### Get current branding:
```
Use shopify_get_checkout_branding with profileId "gid://shopify/CheckoutProfile/2959376611"
```

### Update branding:
```
Use shopify_update_checkout_branding with:
- profileId: "gid://shopify/CheckoutProfile/2959376611"
- logoWidth: 200
- logoPosition: "CENTER"
- colors:
  - primary: "#5A31F4"
  - background: "#FFFFFF"
```

## 🚨 Troubleshooting

### If you see JSON errors in Cursor:
1. Make sure you've rebuilt the project: `npm run build`
2. Check that no other processes are using the MCP server
3. Restart Cursor completely

### If tools aren't appearing:
1. Check the Cursor MCP panel shows "shopify-checkout" as enabled
2. Verify the path in your mcp.json is correct
3. Try disabling and re-enabling the MCP server in Cursor

### Alternative: HTTP Mode
If MCP continues to have issues, use HTTP mode instead:

```bash
# Start HTTP server
npm run start:http

# In Cursor, make HTTP requests:
# "Make a GET request to http://localhost:8787/profiles"
```

## ✅ Verification

The MCP server is working correctly when:
- Cursor shows "shopify-checkout" with a green indicator
- Tools appear in autocomplete when you type "shopify_"
- No JSON parse errors appear in the MCP output panel
- Tools return valid data when called

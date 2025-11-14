# Shopify Checkout Branding MCP Tool

A Model Context Protocol (MCP) server for comprehensive Shopify checkout branding management through AI-powered tools. This production-ready server enables AI assistants like Claude and Cursor to programmatically customize every aspect of your Shopify Plus checkout - from colors and typography to sections, form controls, and complete design systems.

> **🚀 Production-Ready**: Full API compatibility, intelligent value mapping, enhanced tool descriptions, and safety-first defaults for accurate AI-driven checkout customization.

## ✅ Cursor MCP Support Fixed!

The MCP server now works correctly with Cursor. The JSON communication issue has been resolved. See [CURSOR-MCP-SETUP.md](CURSOR-MCP-SETUP.md) for details.

## 🎯 Quick Start

### For Claude Desktop Users

1. **Install and configure:**
```bash
# Clone and setup
git clone https://github.com/shandut/Shopify-Checkout-Branding-MCP-Tool.git
cd shopify-checkout-mcp-tool
npm install
npm run build

# Create .env file with your credentials
cp env.template .env
# Edit .env with your Shopify store details
```

2. **Configure Claude Desktop** (see Configuration section below)

3. **Use natural language in Claude:**
- "Show me all checkout profiles"
- "Center the logo and make it 150px wide"
- "Change the primary color to #5A31F4"

### For Cursor/HTTP API Users

1. **Start the HTTP server:**
```bash
npm run start:http
```

2. **Test the API:**
```bash
node test-http.js
```

## 🚀 Features

### Core Tools
- **List Checkout Profiles**: Retrieve all checkout profiles with TEST/PUBLISHED status
- **Read Current Branding**: Get complete branding configuration and design system
- **Update Branding**: Comprehensive customization with intelligent defaults
  - **🔒 Safety Feature**: Automatically targets TEST/draft profile by default
  - Use `useProductionProfile: true` to explicitly update live checkout
- **Upload Logos**: Stream images from URLs directly to Shopify CDN

### Styling Capabilities
- **Colors**: Background, text, primary (buttons), surface colors with hex validation
- **Typography**: Font families, weights (100-900), base size (12-16), ratios (1.0-1.5)
- **Corner Radius**: NONE, SMALL, BASE, LARGE for all elements
- **Shadows**: 5 levels (SMALL_100, SMALL_200, BASE, LARGE_100, LARGE_200)
- **Padding**: 14 variants (NONE through LARGE_500)
- **Sections**: Independent main area and order summary styling with dividers
- **Form Controls**: Borders, labels (INSIDE/OUTSIDE), corner radius
- **Color Schemes**: 4 schemes for different section contexts
- **Header**: Logo visibility, banner images, cart links, alignment, dividers
- **Background Images**: Support for header banner, main area, order summary
- **Container Dividers**: Configurable style (BASE/DASHED/DOTTED), width, visibility
- **Cart Link**: Custom content type (ICON/IMAGE/TEXT) with image support

### API Intelligence
- **Multi-version Support**: Compatible with API versions 2024-10 through 2026-01
- **Value Mapping**: Automatic conversion for API compatibility
- **Enhanced Descriptions**: Detailed tool documentation for better AI understanding
- **Error Recovery**: Intelligent handling of validation errors

## 📋 Prerequisites

- Node.js 18+ with TypeScript support
- Shopify store with Admin API access
- Shopify Admin API token with appropriate scopes:
  - `read_checkout_branding_settings`
  - `write_checkout_branding_settings`
  - `write_files` (for logo uploads)

## 🛠️ Installation

### ⚠️ Security Note

**Never commit your actual API credentials to version control!**
- Copy `env.template` to `.env` for your credentials
- `.env` is already in `.gitignore` to prevent accidental commits
- All example configurations use placeholder values

### Setup Steps

1. Clone the repository:
```bash
git clone https://github.com/shandut/Shopify-Checkout-Branding-MCP-Tool.git
cd shopify-checkout-mcp-tool
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Configure environment variables:
```bash
cp env.template .env
```

Edit `.env` with your Shopify credentials:
```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_TOKEN=shpat_your_admin_api_token_here
SHOPIFY_API_VERSION=2026-01
PORT=8787  # Only if using HTTP wrapper
```

## 🔧 Configuration

### For Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "shopify-checkout": {
      "command": "node",
      "args": ["/path/to/shopify-checkout-mcp-tool/dist/index.js"],
      "env": {
        "SHOPIFY_STORE_DOMAIN": "your-store.myshopify.com",
        "SHOPIFY_ADMIN_TOKEN": "shpat_your_admin_api_token_here",
        "SHOPIFY_API_VERSION": "2026-01"
      }
    }
  }
}
```

### For Cursor or Other Tools (HTTP Mode)

Run with HTTP wrapper enabled:
```bash
npm run start:http
```

The server will be available at `http://localhost:8787`

## 📚 Available MCP Tools

### 1. `shopify_list_checkout_profiles`
Lists all checkout profiles in your store.

**Input**: None required
**Output**: Array of profiles with id, name, and status

### 2. `shopify_get_checkout_branding`
Retrieves current branding settings for a specific profile.

**Input**: 
- `profileId` (string): Shopify GID of the checkout profile

**Output**: Current logo configuration and color scheme

### 3. `shopify_update_checkout_branding`
Updates branding settings for a checkout profile. **🔒 Defaults to TEST profile for safety**.

**Input**:
- `profileId` (string, optional): Shopify GID - if not provided, auto-selects TEST profile
- `useProductionProfile` (boolean, optional): Set to `true` to update live checkout (default: `false`)
- `logoWidth` (number, optional): Width in pixels (1-1000)
- `logoPosition` (enum, optional): "LEFT", "CENTER", or "RIGHT"
- `colors` (object, optional):
  - `background`: Hex color (e.g., "#FFFFFF")
  - `surface`: Hex color
  - `text`: Hex color
  - `primary`: Hex color for buttons
  - `primaryText`: Hex color for button text
- `control` (object, optional): Form control styling
  - `color`: "TRANSPARENT"
  - `border`: "NONE" or "FULL"
  - `cornerRadius`: Corner style
  - `labelPosition`: "INSIDE" or "OUTSIDE"
- `imageId` (string, optional): ID of uploaded logo

### 4. `shopify_upload_logo_from_url`
Uploads an image from a URL to Shopify Files.

**Input**:
- `url` (string, required): Public HTTPS URL of the image
- `filename` (string, optional): Desired filename
- `mimeType` (string, optional): Image MIME type

**Output**: Image ID and CDN URL for use in branding updates

## 💡 Usage Examples

### Via MCP (in Claude Desktop)

After configuring Claude Desktop, you can use natural language:

> "Can you reduce my checkout logo width by half and center it?"

Claude will:
1. Call `shopify_get_checkout_branding` to get current width
2. Calculate new width (50% of current)
3. Call `shopify_update_checkout_branding` with new settings
4. Verify changes with another `shopify_get_checkout_branding` call

### Via HTTP API (for Cursor)

```bash
# List all checkout profiles
curl http://localhost:8787/profiles

# Get current branding
curl http://localhost:8787/profiles/gid://shopify/CheckoutProfile/123/branding

# Update branding (safer - auto-targets TEST profile)
curl -X POST http://localhost:8787/branding \
  -H "Content-Type: application/json" \
  -d '{
    "logoWidth": 150,
    "logoPosition": "CENTER",
    "colors": {
      "primary": "#5A31F4",
      "background": "#FFFFFF"
    }
  }'

# Update production checkout (explicit)
curl -X POST http://localhost:8787/branding \
  -H "Content-Type: application/json" \
  -d '{
    "useProductionProfile": true,
    "logoWidth": 150,
    "colors": {
      "primary": "#5A31F4"
    }
  }'

# Upload new logo
curl -X POST http://localhost:8787/files \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/new-logo.png",
    "filename": "checkout-logo.png"
  }'
```

## 🏗️ Architecture

```
src/
├── index.ts           # Application entry point
├── mcpServer.ts       # MCP server implementation
├── httpServer.ts      # Optional Fastify HTTP wrapper
├── shopify.ts         # GraphQL client for Shopify API
├── branding.ts        # Business logic for branding operations
├── schemas.ts         # Zod schemas for validation
└── logging.ts         # Pino logger with security redaction
```

## 🔐 Security

- **Token Protection**: API tokens are never logged or exposed in responses
- **Input Validation**: All inputs validated using Zod schemas
- **Rate Limiting**: Automatic retry with exponential backoff for Shopify API limits
- **HTTPS Only**: Only accepts HTTPS URLs for image uploads
- **Scoped Permissions**: Limited to checkout branding and file operations

## 🧪 Testing

Run tests:
```bash
npm test
```

Test against a development store:
```bash
npm run test:integration
```

## 📝 Development

Start development server with hot reload:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## 🚦 Error Handling

The server handles various error scenarios:
- **400**: Invalid input or validation errors
- **403**: Missing required Shopify API scopes
- **429**: Rate limited (automatic retry with backoff)
- **500**: Unexpected server errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Known Limitations & Important Notes

### Typography Field Restrictions
The `customizations.global.typography` field has strict limitations:
- ✅ **Allowed**: `kerning` (BASE, LOOSE, EXTRA_LOOSE), `letterCase` (NONE, LOWER, TITLE, UPPER)
- ❌ **NOT Allowed**: `font`, `size`, `weight` (use `designSystem.typography` for these)

### Other API Limitations
- **Global Corner Radius**: Only accepts `NONE` value
- **Control Color**: Only accepts `TRANSPARENT` value  
- **Logo Format**: SVG files cannot be used for checkout logos
- **Enum Values**: Some enum values differ between API versions (e.g., UPPER vs UPPERCASE)

## 🆘 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review Shopify Admin API documentation

## 🗺️ Roadmap

- [ ] Support for multiple store configurations
- [ ] Bulk profile updates
- [ ] Preview generation before applying changes
- [ ] Backup and restore functionality
- [ ] WebSocket support for real-time updates
- [ ] Integration with Shopify webhooks
- [ ] Support for theme-based branding
- [ ] A/B testing capabilities

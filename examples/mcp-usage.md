# MCP Tool Usage Examples

> **Note**: This tool now defaults to updating the TEST/draft checkout profile for safety. To update the live/published profile, explicitly set `useProductionProfile: true`.

This document demonstrates how to use the Shopify Checkout Branding MCP tools in Claude Desktop or other MCP-capable clients.

## Prerequisites

1. Configure your MCP client (e.g., Claude Desktop) as shown in the README
2. Ensure you have valid Shopify credentials configured
3. Your Shopify store must be on a Plus plan or Development store plan

## Tool Usage Examples

### 1. List All Checkout Profiles

```
Use the shopify_list_checkout_profiles tool to list all checkout profiles
```

Expected response:
```json
{
  "profiles": [
    {
      "id": "gid://shopify/CheckoutProfile/1",
      "name": "Default Profile",
      "status": "PUBLISHED"
    }
  ]
}
```

### 2. Get Current Branding Settings

```
Use the shopify_get_checkout_branding tool with profileId: "gid://shopify/CheckoutProfile/1"
```

Expected response:
```json
{
  "header": {
    "logo": {
      "width": 200,
      "position": "LEFT",
      "image": {
        "id": "gid://shopify/MediaImage/123",
        "url": "https://cdn.shopify.com/..."
      }
    }
  },
  "colors": {
    "background": "#FFFFFF",
    "surface": "#F5F5F5",
    "text": "#333333",
    "primary": "#000000",
    "primaryText": "#FFFFFF"
  }
}
```

### 3. Update Logo Position and Size

```
Use the shopify_update_checkout_branding tool with:
- profileId: "gid://shopify/CheckoutProfile/1"
- logoWidth: 150
- logoPosition: "CENTER"
```

### 4. Update Color Scheme

```
Use the shopify_update_checkout_branding tool with:
- profileId: "gid://shopify/CheckoutProfile/1"
- colors:
  - primary: "#5A31F4"
  - primaryText: "#FFFFFF"
  - background: "#FAFAFA"
  - text: "#1A1A1A"
```

### 5. Upload and Set New Logo

Step 1: Upload logo from URL
```
Use the shopify_upload_logo_from_url tool with:
- url: "https://example.com/new-logo.png"
- filename: "checkout-logo.png"
```

Step 2: Apply the uploaded logo
```
Use the shopify_update_checkout_branding tool with:
- profileId: "gid://shopify/CheckoutProfile/1"
- imageId: [ID from previous upload]
- logoWidth: 180
- logoPosition: "LEFT"
```

## Natural Language Examples for Claude

You can also use natural language when working with Claude Desktop:

1. **"Can you show me all checkout profiles in my store?"**
   - Claude will use `shopify_list_checkout_profiles`

2. **"What's the current branding for profile gid://shopify/CheckoutProfile/1?"**
   - Claude will use `shopify_get_checkout_branding`

3. **"Reduce the logo size by half and center it"**
   - Claude will:
     1. Get current branding
     2. Calculate new width (50% of current)
     3. Update with new width and CENTER position

4. **"Change the checkout colors to match our brand: purple primary (#5A31F4) with white text"**
   - Claude will update colors accordingly

5. **"Upload this logo and set it as the checkout logo: https://example.com/logo.png"**
   - Claude will:
     1. Upload the logo using `shopify_upload_logo_from_url`
     2. Update branding with the new image ID

## Common Workflows

### Complete Rebrand Workflow

1. List profiles to find the right one
2. Get current branding as baseline
3. Upload new logo from URL
4. Update branding with:
   - New logo (imageId)
   - Logo position and size
   - Complete color scheme
5. Verify changes by getting branding again

### A/B Testing Setup

1. Create/identify different checkout profiles
2. Apply different branding to each:
   - Profile A: Left-aligned logo, blue theme
   - Profile B: Centered logo, green theme
3. Monitor performance through Shopify admin

## Error Handling

Common errors and solutions:

- **"Missing required scopes"**: Ensure your API token has checkout branding permissions
- **"Profile not found"**: Verify the profile ID is correct and exists
- **"Invalid color format"**: Use 7-character hex codes (e.g., #FFFFFF)
- **"Rate limited"**: Wait and retry, the tool handles this automatically
- **"Invalid logo URL"**: Ensure the URL is publicly accessible and uses HTTPS

## Best Practices

1. Always get current branding before making updates
2. Test changes on a draft profile before applying to published
3. Keep logo width between 100-300px for optimal display
4. Use high-contrast colors for accessibility
5. Upload logos in PNG or SVG format for best quality

## Advanced Examples

### Complete Brand Application (e.g., BCF Branding)

```json
{
  "tool": "shopify_update_checkout_branding",
  "arguments": {
    "colors": {
      "background": "#FFFFFF",
      "text": "#1B2951",
      "primary": "#FF6B00",
      "primaryText": "#FFFFFF",
      "surface": "#F5F5F5"
    },
    "typography": {
      "primaryFont": "Assistant",
      "primaryWeight": 600,
      "secondaryFont": "Assistant",
      "secondaryWeight": 400,
      "size": {
        "base": 14,
        "ratio": 1.15
      }
    },
    "logoPosition": "CENTER",
    "logoWidth": 140,
    "mainSection": {
      "colorScheme": "COLOR_SCHEME1",
      "cornerRadius": "NONE",
      "shadow": "SMALL_100",
      "padding": "BASE"
    },
    "orderSummary": {
      "colorScheme": "COLOR_SCHEME1",
      "cornerRadius": "NONE",
      "shadow": "SMALL_100",
      "padding": "BASE",
      "border": "FULL"
    },
    "control": {
      "border": "FULL",
      "color": "TRANSPARENT",
      "cornerRadius": "SMALL",
      "labelPosition": "INSIDE"
    }
  }
}
```

### Update to Production Profile

```json
{
  "tool": "shopify_update_checkout_branding",
  "arguments": {
    "useProductionProfile": true,
    "colors": {
      "primary": "#FF6B00"
    }
  }
}
```

### Setup Color Schemes

```json
{
  "tool": "shopify_update_checkout_branding",
  "arguments": {
    "schemes": {
      "scheme1": {
        "background": "#FFFFFF",
        "text": "#1B2951",
        "accent": "#FF6B00"
      },
      "scheme2": {
        "background": "#1B2951",
        "text": "#FFFFFF",
        "accent": "#FF6B00"
      }
    },
    "header": {
      "colorScheme": "COLOR_SCHEME2"
    }
  }
}
```

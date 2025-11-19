# Custom Font Usage Examples

This document provides comprehensive examples for uploading and using custom fonts in Shopify Checkout Branding.

## Prerequisites

- Font files in WOFF, WOFF2, TTF, or OTF format (WOFF2 recommended for performance)
- Public HTTPS URLs for the font files
- Appropriate webfont license for commercial use
- Shopify Plus plan or Development store

## Step-by-Step Workflow

### Step 1: Upload Regular Font Weight

Upload the regular (400 weight) version of your custom font:

```json
// Using shopify_upload_custom_font_from_url tool
{
  "url": "https://example.com/fonts/mybrand-regular.woff2",
  "filename": "mybrand-regular.woff2",
  "fontWeight": 400
}
```

Response:
```json
{
  "genericFileId": "gid://shopify/GenericFile/123456789",
  "url": "https://cdn.shopify.com/s/files/1/0000/0001/files/mybrand-regular.woff2",
  "weight": 400,
  "filename": "mybrand-regular.woff2"
}
```

### Step 2: Upload Bold Font Weight

Upload the bold (700 weight) version of your custom font:

```json
// Using shopify_upload_custom_font_from_url tool
{
  "url": "https://example.com/fonts/mybrand-bold.woff2",
  "isBold": true
}
```

Response:
```json
{
  "genericFileId": "gid://shopify/GenericFile/987654321",
  "url": "https://cdn.shopify.com/s/files/1/0000/0001/files/mybrand-bold.woff2",
  "weight": 700,
  "filename": "mybrand-bold.woff2"
}
```

### Step 3: Apply Custom Font to Primary Surface (Body Text)

Use the uploaded font IDs to set custom fonts for body text:

```json
// Using shopify_update_checkout_branding tool
{
  "designSystem": {
    "typography": {
      "primary": {
        "customFontGroup": {
          "base": {
            "genericFileId": "gid://shopify/GenericFile/123456789",
            "weight": 400
          },
          "bold": {
            "genericFileId": "gid://shopify/GenericFile/987654321",
            "weight": 700
          },
          "loadingStrategy": "SWAP"
        }
      }
    }
  }
}
```

### Step 4: Apply Custom Font to Secondary Surface (Headings)

Set custom fonts for headings:

```json
// Using shopify_update_checkout_branding tool
{
  "designSystem": {
    "typography": {
      "secondary": {
        "customFontGroup": {
          "base": {
            "genericFileId": "gid://shopify/GenericFile/123456789",
            "weight": 400
          },
          "bold": {
            "genericFileId": "gid://shopify/GenericFile/987654321",
            "weight": 700
          },
          "loadingStrategy": "SWAP"
        }
      }
    }
  }
}
```

## Advanced Examples

### Upload Multiple Font Weights

For more sophisticated typography, upload multiple weights:

```javascript
// Light weight (300)
{
  "url": "https://example.com/fonts/mybrand-light.woff2",
  "fontWeight": 300
}

// Medium weight (500)
{
  "url": "https://example.com/fonts/mybrand-medium.woff2",
  "fontWeight": 500
}

// Heavy weight (900)
{
  "url": "https://example.com/fonts/mybrand-heavy.woff2",
  "fontWeight": 900
}
```

### Complete Typography Configuration

Combine custom fonts with size and other typography settings:

```json
{
  "designSystem": {
    "typography": {
      "size": {
        "base": 16,      // Base font size in pixels
        "ratio": 1.4     // Scale ratio for size variations
      },
      "primary": {
        "customFontGroup": {
          "base": {
            "genericFileId": "gid://shopify/GenericFile/123456789",
            "weight": 400
          },
          "bold": {
            "genericFileId": "gid://shopify/GenericFile/987654321",
            "weight": 700
          },
          "loadingStrategy": "SWAP"
        }
      },
      "secondary": {
        "customFontGroup": {
          "base": {
            "genericFileId": "gid://shopify/GenericFile/555666777",
            "weight": 600
          },
          "bold": {
            "genericFileId": "gid://shopify/GenericFile/888999000",
            "weight": 800
          },
          "loadingStrategy": "SWAP"
        }
      }
    }
  },
  "customizations": {
    "headingLevel1": {
      "typography": {
        "font": "SECONDARY",
        "size": "EXTRA_LARGE",
        "weight": "BOLD",
        "letterCase": "NONE",
        "kerning": "BASE"
      }
    },
    "headingLevel2": {
      "typography": {
        "font": "SECONDARY",
        "size": "LARGE",
        "weight": "BOLD"
      }
    },
    "primaryButton": {
      "typography": {
        "font": "PRIMARY",
        "weight": "BOLD",
        "letterCase": "UPPER"
      }
    }
  }
}
```

## Font Loading Strategies

Choose the appropriate loading strategy based on your performance needs:

### SWAP (Recommended)
```json
{
  "loadingStrategy": "SWAP"
}
```
- Shows fallback font immediately
- Swaps to custom font when loaded
- Best for performance and user experience

### FALLBACK
```json
{
  "loadingStrategy": "FALLBACK"
}
```
- Short block period (100ms)
- Falls back to system font if not loaded quickly
- Good balance between custom fonts and performance

### OPTIONAL
```json
{
  "loadingStrategy": "OPTIONAL"
}
```
- Very short block period
- May not swap if font loads slowly
- Prioritizes performance over custom font display

### BLOCK (Not Recommended)
```json
{
  "loadingStrategy": "BLOCK"
}
```
- Blocks text rendering until font loads
- Can cause poor user experience
- Use only if custom font is critical

## Natural Language Examples (for MCP)

When using the tool through Claude Desktop, you can use natural language:

> "Upload the custom font from https://example.com/myfont.woff2"

> "Upload both regular and bold versions of my brand font from these URLs..."

> "Set my custom fonts for all text in checkout"

> "Use my uploaded custom font for headings only"

> "Apply custom font with SWAP loading strategy for better performance"

## Troubleshooting

### Font Not Displaying
1. Verify the genericFileId is correct
2. Check that font file uploaded successfully
3. Ensure loadingStrategy is set appropriately
4. Confirm font weight values match the actual font files

### Performance Issues
1. Use WOFF2 format for smaller file sizes
2. Set loadingStrategy to "SWAP" or "FALLBACK"
3. Limit the number of font weights uploaded
4. Consider using system fonts for less critical text

### License Compliance
- Ensure you have proper webfont licensing
- Some desktop fonts don't include web usage rights
- Consider using open-source fonts or purchasing webfont licenses

## Best Practices

1. **Performance First**: Always use WOFF2 format and SWAP loading strategy
2. **Limit Weights**: Upload only the font weights you actually use
3. **Test Thoroughly**: Preview changes in TEST profile before applying to PRODUCTION
4. **Fallback Planning**: Ensure fallback fonts are visually similar to custom fonts
5. **Accessibility**: Maintain good contrast and readability with custom fonts

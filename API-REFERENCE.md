# Shopify Checkout Branding API Reference

## Overview
Complete reference for the Shopify Admin GraphQL API (2026-01) checkout branding system, including all valid enum values, context-specific requirements, and automatic mappings.

## API Version Support
- **Primary**: 2026-01 (release candidate)
- **Compatible**: 2024-10, 2025-10
- **Store Requirements**: Plus plan or Development store

## Enum Values Reference

### Background (CheckoutBrandingBackground)
**Valid API Values:**
- `BASE` - Solid base color
- `SUBDUED` - Solid subdued color  
- `TRANSPARENT` - Transparent background

**User-Friendly Aliases (Auto-Mapped):**
- `SOLID` → `BASE`
- `NONE` → `TRANSPARENT`

### Shadow (CheckoutBrandingShadow)
**Valid API Values (ONLY these 5):**
- `SMALL_100` - Small 100 shadow (smallest)
- `SMALL_200` - Small 200 shadow
- `BASE` - Base shadow (standard)
- `LARGE_100` - Large 100 shadow
- `LARGE_200` - Large 200 shadow (largest)

**Invalid Values (Auto-Mapped):**
- `NONE` → `SMALL_100`
- `BASE_200` → `LARGE_100`
- `EXTRA_LARGE_300` → `LARGE_200`

### Padding/Spacing - Context Specific!

#### Section/Footer Padding
**For:** `main.section`, `orderSummary.section`, `footer`
```
NONE | BASE | BASE_500 | SMALL | SMALL_100-500 | LARGE | LARGE_100-500
```

#### Button Padding  
**For:** `primaryButton`, `secondaryButton`
```
NONE | EXTRA_TIGHT | TIGHT | BASE | LOOSE | EXTRA_LOOSE
```

**Auto-Mapping (Section Context):**
- `EXTRA_TIGHT` → `SMALL`
- `TIGHT` → `SMALL_100`
- `LOOSE` → `LARGE`
- `EXTRA_LOOSE` → `LARGE_500`

### Border Width - Context Specific!

#### Section & Container Dividers
**For:** `main.section`, `orderSummary.section`, `main.divider`, `orderSummary.divider`
```
BASE | LARGE | LARGE_100 | LARGE_200
```

#### Global Divider
**For:** `customizations.divider`
```
NONE | BASE | MEDIUM
```

**Auto-Mapping (Section Context):**
- `NONE` → `BASE`
- `MEDIUM` → `LARGE`

### Corner Radius (CheckoutBrandingCornerRadius)
```
NONE | SMALL | BASE | LARGE
```

**Note:** `globalCornerRadius` ONLY accepts `NONE` (API limitation)

### Border Style
#### Simple Border
```
NONE | FULL
```

#### Divider Border Style  
```
BASE | DASHED | DOTTED
```

### Color Schemes
```
COLOR_SCHEME1 | COLOR_SCHEME2 | COLOR_SCHEME3 | COLOR_SCHEME4
```

### Typography

#### Letter Case
```
NONE | LOWER | TITLE | UPPER
```
**Note:** Use `UPPER` not `UPPERCASE`

#### Font Weight
```
BASE | BOLD
```

#### Font Size
```
EXTRA_SMALL | SMALL | BASE | MEDIUM | LARGE | EXTRA_LARGE | EXTRA_EXTRA_LARGE
```

#### Kerning
```
BASE | LOOSE | EXTRA_LOOSE
```

### Visibility
```
VISIBLE | HIDDEN
```

### Header Position
**Legacy Values (Auto-Mapped):**
- `LEFT` → `START`
- `CENTER` → `INLINE`
- `RIGHT` → `INLINE_SECONDARY`

**Current API Values:**
```
START | INLINE | INLINE_SECONDARY
```

### Form Controls
#### Label Position
```
INSIDE | OUTSIDE
```

#### Control Color
```
TRANSPARENT
```
**Note:** ONLY `TRANSPARENT` is currently supported

### Cart Link Content Type
```
ICON | IMAGE | TEXT
```

## Field Placement Guide

### Design System vs Customizations

#### Goes in `designSystem`:
- Colors (global, schemes)
- Typography (font families, size, weight)
- Corner radius variables

#### Goes in `customizations`:
- Section-specific settings
- UI element customizations
- Logo positioning
- Dividers
- Form controls

### Typography Field Placement
- `font`, `size`, `weight` → `designSystem.typography`
- `kerning`, `letterCase` → `customizations.global.typography` (if global)

## Important Limitations

### Global Limitations
- `globalCornerRadius`: ONLY accepts `NONE`
- `control.color`: ONLY accepts `TRANSPARENT`

### Divider Differences
- **Global divider** (`customizations.divider`): NO visibility field
- **Container dividers** (`main.divider`, etc.): Has visibility field

### Typography Restrictions
When setting global typography (`customizations.global.typography`):
- Can ONLY set: `kerning`, `letterCase`
- Cannot set: `font`, `size`, `weight` (these go in `designSystem.typography`)

## Complete Field Structure

```typescript
{
  designSystem: {
    colors: {
      global: {
        brand, accent, critical, decorative, info, success, warning
      },
      schemes: {
        scheme1: {
          base: { background, text },
          primaryButton: { background, hover, text },
          // ... other components
        },
        scheme2: { /* same structure */ }
      }
    },
    typography: {
      primary: { shopifyFontGroup: { name } },
      secondary: { shopifyFontGroup: { name } },
      size: { base, ratio }
    },
    cornerRadius: { base, large, small }
  },
  customizations: {
    global: {
      cornerRadius: 'NONE', // Only NONE supported
      typography: { kerning, letterCase } // Limited fields
    },
    header: {
      logo: { image, maxWidth, visibility },
      banner: { mediaImageId },
      cartLink: { contentType, image },
      position, alignment, divided, padding, colorScheme
    },
    footer: {
      content: { visibility },
      colorScheme, padding
    },
    main: {
      section: { background, border, borderWidth, cornerRadius, padding, shadow, colorScheme },
      backgroundImage: { mediaImageId },
      divider: { borderStyle, borderWidth, visibility },
      colorScheme
    },
    orderSummary: {
      section: { /* same as main.section */ },
      backgroundImage: { mediaImageId },
      divider: { borderStyle, borderWidth, visibility },
      colorScheme
    },
    primaryButton: {
      background, border, cornerRadius, blockPadding, inlinePadding, typography
    },
    secondaryButton: { /* same as primaryButton */ },
    control: {
      border, color: 'TRANSPARENT', cornerRadius, labelPosition
    },
    textField: { border, typography },
    select: { border, typography },
    checkbox: { cornerRadius },
    divider: { borderStyle, borderWidth }, // NO visibility!
    // ... other elements
  }
}
```

## Common Use Cases

### Set Primary Button Color
```javascript
// Option 1: Global brand color (affects all brand elements)
{ globalBrand: "#FF6B00" }

// Option 2: Design system brand
{ designSystem: { colors: { global: { brand: "#FF6B00" } } } }

// Option 3: Specific button color
{ designSystem: { colors: { schemes: { scheme1: { primaryButton: { background: "#FF6B00" } } } } } }
```

### Apply Section Styling
```javascript
{
  customizations: {
    main: {
      section: {
        background: "BASE",  // or "SUBDUED", "TRANSPARENT"
        shadow: "LARGE_100", // Valid shadow value
        padding: "LARGE",    // Section padding value
        cornerRadius: "LARGE",
        borderWidth: "BASE"  // Section border width value
      }
    }
  }
}
```

### Safety: Default to TEST Profile
```javascript
// Defaults to TEST profile
{ colors: { ... } }

// Explicitly use production
{ useProductionProfile: true, colors: { ... } }
```

## Error Prevention

The tool automatically:
1. Maps incorrect enum values to valid ones
2. Defaults to TEST profile for safety
3. Validates all enum values before API calls
4. Handles context-specific value differences
5. Places typography fields in correct locations

## Testing

Tested with:
- Store: your-store.myshopify.com
- API Version: 2026-01
- All enum value mappings verified
- Context-specific values validated

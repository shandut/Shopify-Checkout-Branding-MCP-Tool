# Testing Guide

## Test Credentials
- **Store**: your-store.myshopify.com
- **API Token**: shpat_your_admin_api_token_here
- **API Version**: 2026-01

## Test Profiles
The test store has two checkout profiles:
1. **TEST Profile** (gid://shopify/CheckoutProfile/2995978467) - "TEST of BCF Demo configuration" - Draft/unpublished
2. **PRODUCTION Profile** (gid://shopify/CheckoutProfile/2959376611) - "BCF Demo configuration" - Published/live

## Example Test: SUPERNOVA Design

The SUPERNOVA design was successfully applied to demonstrate the tool's capabilities:

### Design Requirements
- **Primary Color**: Orange (#FF6B00)
- **Background**: White (#FFFFFF)
- **Text**: Dark gray (#1A1A1A)
- **Surface**: Light gray (#F5F5F5)
- **Typography**: System fonts, size 14px base
- **Corner Radius**: Large for main sections
- **Shadows**: Large shadows for depth
- **Padding**: Large padding for spacious feel

### Test Command
```javascript
{
  profileId: "gid://shopify/CheckoutProfile/2995978467", // TEST profile
  globalBrand: "#FF6B00",
  colors: {
    background: "#FFFFFF",
    text: "#1A1A1A",
    surface: "#F5F5F5",
    primary: "#FF6B00",
    primaryText: "#FFFFFF"
  },
  typography: {
    primaryFont: "Helvetica, Arial, sans-serif",
    size: 14
  },
  mainSection: {
    cornerRadius: "LARGE",
    padding: "LARGE",
    shadow: "LARGE_100",
    background: "BASE"
  },
  orderSummary: {
    cornerRadius: "LARGE",
    padding: "LARGE",
    shadow: "LARGE_100",
    background: "SUBDUED"
  },
  control: {
    border: "FULL",
    cornerRadius: "BASE",
    labelPosition: "OUTSIDE"
  }
}
```

### Test Results
✅ All branding elements successfully applied
✅ Correct enum value mappings
✅ Profile targeting worked correctly
✅ Form controls remained readable
✅ Typography applied correctly

## Common Test Scenarios

### 1. Test Enum Value Mapping
```javascript
// Test with incorrect values - should auto-map
{
  mainSection: {
    background: "SOLID",     // Maps to BASE
    shadow: "NONE",         // Maps to SMALL_100
    padding: "EXTRA_LOOSE", // Maps to LARGE_500
    borderWidth: "MEDIUM"   // Maps to LARGE
  }
}
```

### 2. Test Profile Safety
```javascript
// Should default to TEST profile
{ colors: { primary: "#FF0000" } }

// Explicitly use production (be careful!)
{ useProductionProfile: true, colors: { primary: "#FF0000" } }
```

### 3. Test Context-Specific Values
```javascript
{
  // Section padding (uses section values)
  mainSection: { padding: "LARGE_500" },
  
  // Button padding (uses button values)
  primaryButton: { inlinePadding: "EXTRA_LOOSE" },
  
  // Global divider (accepts MEDIUM)
  divider: { borderWidth: "MEDIUM" },
  
  // Section divider (doesn't accept MEDIUM)
  main: { divider: { borderWidth: "LARGE" } }
}
```

## Validation Checklist

Before running tests:
- [ ] Confirm store domain and API token are set
- [ ] Verify API version is 2026-01
- [ ] Check if targeting TEST or PRODUCTION profile
- [ ] Review enum values match API requirements
- [ ] Ensure hex colors are valid (#RRGGBB format)

## Error Handling

Common errors and solutions:

1. **Invalid enum value**: Check API-REFERENCE.md for valid values
2. **Field doesn't exist**: Verify field placement (designSystem vs customizations)
3. **Profile not found**: Use `listProfiles()` to get correct profile IDs
4. **Typography placement**: Remember global typography has limited fields
5. **Control color**: Only accepts `TRANSPARENT`

## Preview URLs

After applying changes:
- **TEST Profile**: Preview in admin checkout editor
- **PRODUCTION Profile**: Changes immediately visible at checkout

## Safety Notes

1. Always test on the TEST profile first
2. The tool defaults to TEST profile for safety
3. Production changes are immediate - no undo!
4. Keep original settings documented before making changes

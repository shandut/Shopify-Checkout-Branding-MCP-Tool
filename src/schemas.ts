import { z } from 'zod';

// ============================================
// BASE TYPES & VALIDATORS
// ============================================

// Profile ID must be a Shopify GID
export const profileIdSchema = z.string()
  .refine(val => val.startsWith('gid://shopify/CheckoutProfile/'), {
    message: 'Profile ID must be a valid Shopify GID (gid://shopify/CheckoutProfile/...)'
  });

// Hex color validation
export const hexColorSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (#RRGGBB)');

// Optional hex color
export const optionalHexColorSchema = hexColorSchema.optional();

// Image ID must be a Shopify GID
export const imageIdSchema = z.string()
  .refine(val => val.startsWith('gid://shopify/'), {
    message: 'Image ID must be a valid Shopify GID'
  });

// HTTPS URL validation
export const httpsUrlSchema = z.string()
  .url('Must be a valid URL')
  .refine(url => url.startsWith('https://'), {
    message: 'URL must use HTTPS protocol',
  });

// ============================================
// DESIGN SYSTEM ENUMS
// ============================================

// Corner radius values
export const cornerRadiusSchema = z.enum(['NONE', 'SMALL', 'BASE', 'LARGE']);

// Shadow values - EXACT API values only!
// CheckoutBrandingShadow enum from Shopify Admin API
export const shadowSchema = z.enum([
  'SMALL_100',  // Small 100 shadow
  'SMALL_200',  // Small 200 shadow
  'BASE',       // Base shadow
  'LARGE_100',  // Large 100 shadow
  'LARGE_200'   // Large 200 shadow
  // NOTE: There is NO 'NONE', 'BASE_200', or 'EXTRA_LARGE_300' value!
]);

// Padding/spacing values for sections
export const spacingKeywordSchema = z.enum([
  'NONE',
  'BASE',
  'BASE_500', // Extended support
  'SMALL',
  'SMALL_100',
  'SMALL_200',
  'SMALL_300',
  'SMALL_400',
  'SMALL_500',
  'LARGE',
  'LARGE_100',
  'LARGE_200',
  'LARGE_300',
  'LARGE_400',
  'LARGE_500'
]);

// Spacing values for button inline/block padding
export const buttonSpacingSchema = z.enum([
  'NONE',
  'EXTRA_TIGHT',
  'TIGHT',
  'BASE',
  'LOOSE',
  'EXTRA_LOOSE'
]);

// Color scheme selection
export const colorSchemeSelectionSchema = z.enum([
  'COLOR_SCHEME1',
  'COLOR_SCHEME2',
  'COLOR_SCHEME3',
  'COLOR_SCHEME4'
]);

// Border styles
export const borderStyleSchema = z.enum(['NONE', 'FULL', 'BLOCK_END']);
export const simpleBorderSchema = z.enum(['NONE', 'FULL']);
export const dividerBorderStyleSchema = z.enum(['NONE', 'BASE', 'DASHED', 'DOTTED']);

// Background styles (for buttons)
export const backgroundStyleSchema = z.enum(['NONE', 'SOLID']);

// Visibility
export const visibilitySchema = z.enum(['VISIBLE', 'HIDDEN']);

// Section background style (CheckoutBrandingBackground)
// Accepts both API values and user-friendly values (mapped in branding logic)
export const backgroundSchema = z.enum([
  // API values
  'BASE',       // Solid base color
  'SUBDUED',    // Solid subdued color
  'TRANSPARENT', // Transparent background
  // User-friendly aliases (will be mapped)
  'SOLID',      // Alias for BASE
  'NONE'        // Alias for TRANSPARENT
]);

// Border width (CheckoutBrandingBorderWidth)
// Note: API actually expects different values for sections/dividers vs global divider
// Sections and container dividers use: BASE, LARGE, LARGE_100, LARGE_200
// Global divider uses: NONE, BASE, MEDIUM
export const borderWidthSchema = z.enum([
  'BASE',
  'LARGE',
  'LARGE_100', 
  'LARGE_200',
  // Also accept these for compatibility/mapping
  'NONE',
  'MEDIUM'
]);

// Label position for form controls
export const labelPositionSchema = z.enum(['INSIDE', 'OUTSIDE']);

// Typography weight
export const typographyWeightSchema = z.enum(['BASE', 'BOLD']);

// Typography size
export const typographySizeSchema = z.enum(['SMALL', 'BASE', 'LARGE', 'EXTRA_LARGE']);

// Header alignment
export const headerAlignmentSchema = z.enum(['START', 'CENTER', 'END']);

// Header position
export const headerPositionSchema = z.enum(['START', 'INLINE', 'INLINE_SECONDARY']);

// ============================================
// DESIGN SYSTEM TYPES
// ============================================

// Global colors
export const globalColorsSchema = z.object({
  brand: optionalHexColorSchema,
  accent: optionalHexColorSchema,
  critical: optionalHexColorSchema,
  decorative: optionalHexColorSchema,
  info: optionalHexColorSchema,
  success: optionalHexColorSchema,
  warning: optionalHexColorSchema,
});

// Color roles (used in color schemes)
export const colorRolesSchema = z.object({
  background: optionalHexColorSchema,
  text: optionalHexColorSchema,
  border: optionalHexColorSchema,
  icon: optionalHexColorSchema,
  accent: optionalHexColorSchema,
  decorative: optionalHexColorSchema,
});

// Button color roles (includes hover state)
export const buttonColorRolesSchema = z.object({
  background: optionalHexColorSchema,
  text: optionalHexColorSchema,
  border: optionalHexColorSchema,
  icon: optionalHexColorSchema,
  accent: optionalHexColorSchema,
  decorative: optionalHexColorSchema,
  hover: colorRolesSchema.optional(),
});

// Control color roles (includes selected state)
export const controlColorRolesSchema = z.object({
  background: optionalHexColorSchema,
  text: optionalHexColorSchema,
  border: optionalHexColorSchema,
  icon: optionalHexColorSchema,
  accent: optionalHexColorSchema,
  selected: colorRolesSchema.optional(),
});

// Color scheme
export const colorSchemeSchema = z.object({
  base: colorRolesSchema.optional(),
  control: controlColorRolesSchema.optional(),
  primaryButton: buttonColorRolesSchema.optional(),
  secondaryButton: buttonColorRolesSchema.optional(),
});

// Color schemes collection
export const colorSchemesSchema = z.object({
  scheme1: colorSchemeSchema.optional(),
  scheme2: colorSchemeSchema.optional(),
  scheme3: colorSchemeSchema.optional(),
  scheme4: colorSchemeSchema.optional(),
});

// Colors (global + schemes)
export const colorsInputSchema = z.object({
  global: globalColorsSchema.optional(),
  schemes: colorSchemesSchema.optional(),
});

// Typography font
export const typographyFontSchema = z.object({
  shopifyFontGroup: z.object({
    name: z.string(),
  }).optional(),
  customFontGroup: z.object({
    base: z.object({
      genericFileId: z.string(),
      weight: z.number().min(100).max(900).optional(),
    }),
    bold: z.object({
      genericFileId: z.string().optional(),
      weight: z.number().min(100).max(900).optional(),
    }).optional(),
    loadingStrategy: z.enum(['BLOCK', 'SWAP', 'FALLBACK', 'OPTIONAL']).optional(),
  }).optional(),
});

// Typography style for global customizations (limited fields)
export const typographyStyleGlobalSchema = z.object({
  kerning: z.enum(['BASE', 'LOOSE', 'EXTRA_LOOSE']).optional(),
  letterCase: z.enum(['NONE', 'LOWER', 'TITLE', 'UPPER']).optional(), // Note: API uses UPPER not UPPERCASE
});

// Typography style for other elements (full fields)
export const typographyStyleSchema = z.object({
  font: z.string().optional(),
  kerning: z.enum(['BASE', 'LOOSE', 'EXTRA_LOOSE']).optional(),
  letterCase: z.enum(['NONE', 'LOWER', 'TITLE', 'UPPER']).optional(), // Note: API uses UPPER not UPPERCASE
  size: typographySizeSchema.optional(),
  weight: typographyWeightSchema.optional(),
});

// Typography size settings
export const typographySizeSettingsSchema = z.object({
  base: z.number().min(12).max(18).optional(),
  ratio: z.number().min(1.0).max(1.5).optional(),
});

// Typography
export const typographyInputSchema = z.object({
  primary: typographyFontSchema.optional(),
  secondary: typographyFontSchema.optional(),
  size: typographySizeSettingsSchema.optional(),
  global: typographyStyleSchema.optional(),
});

// Corner radius variables
export const cornerRadiusVariablesSchema = z.object({
  base: z.number().min(0).max(30).optional(),
  large: z.number().min(0).max(50).optional(),
  small: z.number().min(0).max(20).optional(),
});

// Design system
export const designSystemInputSchema = z.object({
  colors: colorsInputSchema.optional(),
  typography: typographyInputSchema.optional(),
  cornerRadius: cornerRadiusVariablesSchema.optional(),
});

// ============================================
// CUSTOMIZATIONS TYPES
// ============================================

// Global customizations
export const globalCustomizationsSchema = z.object({
  cornerRadius: z.enum(['NONE']).optional(), // Only NONE is valid for global
  typography: typographyStyleGlobalSchema.optional(), // Limited to kerning and letterCase only
});

// Container divider
export const containerDividerSchema = z.object({
  borderStyle: dividerBorderStyleSchema.optional(),
  borderWidth: borderWidthSchema.optional(),
  visibility: visibilitySchema.optional(),
});

// Cart link content type
export const cartLinkContentTypeSchema = z.enum(['ICON', 'IMAGE', 'TEXT']);

// Header customizations
export const headerCustomizationsSchema = z.object({
  alignment: headerAlignmentSchema.optional(),
  position: headerPositionSchema.optional(),
  logo: z.object({
    image: z.object({
      mediaImageId: imageIdSchema,
    }).optional(),
    maxWidth: z.number().min(50).max(500).optional(),
    visibility: visibilitySchema.optional(),
  }).optional(),
  banner: z.object({
    mediaImageId: imageIdSchema,
  }).optional(),
  divided: z.boolean().optional(),
  cartLink: z.object({
    contentType: cartLinkContentTypeSchema.optional(),
    image: z.object({
      mediaImageId: imageIdSchema,
    }).optional(),
  }).optional(),
  colorScheme: colorSchemeSelectionSchema.optional(),
  padding: spacingKeywordSchema.optional(),
});

// Footer customizations
export const footerCustomizationsSchema = z.object({
  content: z.object({
    visibility: visibilitySchema.optional(),
  }).optional(),
  colorScheme: colorSchemeSelectionSchema.optional(),
  padding: spacingKeywordSchema.optional(),
});

// Main area section
export const mainSectionSchema = z.object({
  background: backgroundSchema.optional(),
  border: simpleBorderSchema.optional(),
  borderStyle: dividerBorderStyleSchema.optional(),
  borderWidth: borderWidthSchema.optional(),
  colorScheme: colorSchemeSelectionSchema.optional(),
  cornerRadius: cornerRadiusSchema.optional(),
  padding: spacingKeywordSchema.optional(),
  shadow: shadowSchema.optional(),
});

// Main area customizations
export const mainCustomizationsSchema = z.object({
  section: mainSectionSchema.optional(),
  backgroundImage: z.object({
    mediaImageId: imageIdSchema,
  }).optional(),
  divider: containerDividerSchema.optional(),
  colorScheme: colorSchemeSelectionSchema.optional(),
});

// Order summary section
export const orderSummarySectionSchema = z.object({
  background: backgroundSchema.optional(),
  border: simpleBorderSchema.optional(),
  borderStyle: dividerBorderStyleSchema.optional(),
  borderWidth: borderWidthSchema.optional(),
  colorScheme: colorSchemeSelectionSchema.optional(),
  cornerRadius: cornerRadiusSchema.optional(),
  padding: spacingKeywordSchema.optional(),
  shadow: shadowSchema.optional(),
});

// Order summary customizations
export const orderSummaryCustomizationsSchema = z.object({
  section: orderSummarySectionSchema.optional(),
  backgroundImage: z.object({
    mediaImageId: imageIdSchema,
  }).optional(),
  divider: containerDividerSchema.optional(),
  colorScheme: colorSchemeSelectionSchema.optional(),
});

// Button customizations
export const buttonCustomizationsSchema = z.object({
  background: backgroundStyleSchema.optional(),
  border: simpleBorderSchema.optional(),
  cornerRadius: cornerRadiusSchema.optional(),
  blockPadding: buttonSpacingSchema.optional(),
  inlinePadding: buttonSpacingSchema.optional(),
  typography: typographyStyleSchema.optional(),
});

// Form control customizations
export const controlCustomizationsSchema = z.object({
  border: simpleBorderSchema.optional(),
  color: z.enum(['TRANSPARENT']).optional(), // Only TRANSPARENT supported
  cornerRadius: cornerRadiusSchema.optional(),
  labelPosition: labelPositionSchema.optional(),
});

// Text field customizations
export const textFieldCustomizationsSchema = z.object({
  border: simpleBorderSchema.optional(),
  typography: typographyStyleSchema.optional(),
});

// Select customizations
export const selectCustomizationsSchema = z.object({
  border: simpleBorderSchema.optional(),
  typography: typographyStyleSchema.optional(),
});

// Checkbox customizations
export const checkboxCustomizationsSchema = z.object({
  cornerRadius: cornerRadiusSchema.optional(),
});

// Heading level customizations
export const headingLevelCustomizationsSchema = z.object({
  typography: typographyStyleSchema.optional(),
});

// Merchandise thumbnail customizations
export const merchandiseThumbnailCustomizationsSchema = z.object({
  cornerRadius: cornerRadiusSchema.optional(),
  border: simpleBorderSchema.optional(),
});

// Express checkout customizations
export const expressCheckoutCustomizationsSchema = z.object({
  button: z.object({
    cornerRadius: cornerRadiusSchema.optional(),
  }).optional(),
});

// Choice list customizations
export const choiceListCustomizationsSchema = z.object({
  group: z.object({
    spacing: spacingKeywordSchema.optional(),
  }).optional(),
});

// Buyer journey customizations
export const buyerJourneyCustomizationsSchema = z.object({
  visibility: visibilitySchema.optional(),
});

// Cart link customizations
export const cartLinkCustomizationsSchema = z.object({
  visibility: visibilitySchema.optional(),
});

// Divider style customizations (global divider - no visibility!)
// This is for customizations.divider (CheckoutBrandingDividerStyleInput)
export const dividerStyleCustomizationsSchema = z.object({
  borderStyle: dividerBorderStyleSchema.optional(),
  borderWidth: z.enum(['NONE', 'BASE', 'MEDIUM']).optional(), // CheckoutBrandingBorderWidth values
  // NOTE: visibility is NOT available on global divider, only on container dividers
});

// Content customizations
export const contentCustomizationsSchema = z.object({
  divider: containerDividerSchema.optional(), // Uses container divider (with visibility)
});

// All customizations
export const customizationsInputSchema = z.object({
  global: globalCustomizationsSchema.optional(),
  header: headerCustomizationsSchema.optional(),
  footer: footerCustomizationsSchema.optional(),
  main: mainCustomizationsSchema.optional(),
  orderSummary: orderSummaryCustomizationsSchema.optional(),
  primaryButton: buttonCustomizationsSchema.optional(),
  secondaryButton: buttonCustomizationsSchema.optional(),
  control: controlCustomizationsSchema.optional(),
  textField: textFieldCustomizationsSchema.optional(),
  select: selectCustomizationsSchema.optional(),
  checkbox: checkboxCustomizationsSchema.optional(),
  headingLevel1: headingLevelCustomizationsSchema.optional(),
  headingLevel2: headingLevelCustomizationsSchema.optional(),
  headingLevel3: headingLevelCustomizationsSchema.optional(),
  merchandiseThumbnail: merchandiseThumbnailCustomizationsSchema.optional(),
  expressCheckout: expressCheckoutCustomizationsSchema.optional(),
  choiceList: choiceListCustomizationsSchema.optional(),
  buyerJourney: buyerJourneyCustomizationsSchema.optional(),
  cartLink: cartLinkCustomizationsSchema.optional(),
  divider: dividerStyleCustomizationsSchema.optional(),
  content: contentCustomizationsSchema.optional(),
  favicon: z.object({
    mediaImageId: imageIdSchema,
  }).optional(),
});

// ============================================
// MAIN INPUT/OUTPUT SCHEMAS
// ============================================

// Complete checkout branding input
export const checkoutBrandingInputSchema = z.object({
  designSystem: designSystemInputSchema.optional(),
  customizations: customizationsInputSchema.optional(),
});

// Update checkout branding input (for tool)
export const updateCheckoutBrandingInputSchema = z.object({
  profileId: profileIdSchema.optional(),
  useProductionProfile: z.boolean().default(false),
  
  // Legacy simple fields for backward compatibility
  colors: z.object({
    background: hexColorSchema.optional(),
    text: hexColorSchema.optional(),
    primary: hexColorSchema.optional(), // Maps to global.brand
    primaryText: hexColorSchema.optional(),
    surface: hexColorSchema.optional(),
  }).optional(),
  
  logoPosition: z.enum(['LEFT', 'CENTER', 'RIGHT', 'START', 'INLINE', 'INLINE_SECONDARY']).optional(),
  logoWidth: z.number().min(50).max(500).optional(),
  imageId: imageIdSchema.optional(),
  
  // Full design system and customizations
  designSystem: designSystemInputSchema.optional(),
  customizations: customizationsInputSchema.optional(),
  
  // Simplified high-level options (will be mapped to correct structure)
  globalBrand: hexColorSchema.optional(), // Maps to designSystem.colors.global.brand
  primaryButtonColor: hexColorSchema.optional(), // Maps to scheme1.primaryButton.background
  typography: z.object({
    primaryFont: z.string().optional(),
    primaryWeight: z.number().min(100).max(900).optional(),
    secondaryFont: z.string().optional(),
    secondaryWeight: z.number().min(100).max(900).optional(),
    size: z.object({
      base: z.number().min(12).max(18).optional(),
      ratio: z.number().min(1.0).max(1.5).optional(),
    }).optional(),
  }).optional(),
});

// List profiles input/output
export const listCheckoutProfilesInputSchema = z.object({});
export const listCheckoutProfilesOutputSchema = z.object({
  profiles: z.array(z.object({
    id: z.string(),
    name: z.string().nullable(),
    isPublished: z.boolean(),
  })),
});

// Get branding input/output
export const getCheckoutBrandingInputSchema = z.object({
  profileId: profileIdSchema.optional(),
});

export const getCheckoutBrandingOutputSchema = z.object({
  designSystem: z.object({
    colors: z.any().optional(),
    typography: z.any().optional(),
    cornerRadius: z.any().optional(),
  }).optional(),
  customizations: z.any().optional(),
  // Simplified view for backward compatibility
  header: z.object({
    logo: z.object({
      width: z.number().optional(),
      position: z.string().optional(),
      image: z.object({
        id: z.string(),
        url: z.string(),
      }).optional(),
    }).optional(),
  }).optional(),
  colors: z.object({
    background: z.string().optional(),
    text: z.string().optional(),
    primary: z.string().optional(), // Mapped from global.brand
    primaryText: z.string().optional(),
    surface: z.string().optional(),
  }).optional(),
});

// Upload logo input/output
export const uploadLogoFromUrlInputSchema = z.object({
  url: httpsUrlSchema,
  filename: z.string().optional(),
  mimeType: z.string().optional(),
});

export const uploadLogoFromUrlOutputSchema = z.object({
  imageId: z.string(),
  url: z.string(),
});

// Upload custom font input/output
export const uploadCustomFontFromUrlInputSchema = z.object({
  url: httpsUrlSchema,
  filename: z.string().optional().describe('Optional filename for the font'),
  mimeType: z.string().optional().describe('Optional MIME type (auto-detected from extension if not provided)'),
  fontWeight: z.number().optional().describe('Font weight (100-900, default 400 for regular, 700 for bold)'),
  isBold: z.boolean().optional().describe('Whether this is a bold font variant (sets weight to 700 if true)'),
});

export const uploadCustomFontFromUrlOutputSchema = z.object({
  genericFileId: z.string(),
  url: z.string(),
  weight: z.number(),
  filename: z.string(),
});

// Export types from schemas
export type UpdateCheckoutBrandingInput = z.infer<typeof updateCheckoutBrandingInputSchema>;
export type ListCheckoutProfilesOutput = z.infer<typeof listCheckoutProfilesOutputSchema>;
export type GetCheckoutBrandingOutput = z.infer<typeof getCheckoutBrandingOutputSchema>;
export type UploadLogoFromUrlOutput = z.infer<typeof uploadLogoFromUrlOutputSchema>;
export type UploadCustomFontFromUrlOutput = z.infer<typeof uploadCustomFontFromUrlOutputSchema>;

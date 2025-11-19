import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { BrandingService } from './branding.js';
import { ShopifyClient } from './shopify.js';
import {
  listCheckoutProfilesInputSchema,
  getCheckoutBrandingInputSchema,
  updateCheckoutBrandingInputSchema,
  uploadLogoFromUrlInputSchema,
  uploadCustomFontFromUrlInputSchema,
} from './schemas.js';

// Simple Zod to JSON Schema converter
function zodToJsonSchema(schema: z.ZodType<any>): any {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: any = {};
    const required: string[] = [];
    
    for (const [key, field] of Object.entries(shape)) {
      properties[key] = getFieldSchema(field as z.ZodType<any>);
      
      // Check if field is required (not optional)
      if (!(field instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }
  
  return { type: 'object' };
}

function getFieldSchema(field: z.ZodType<any>): any {
  if (field instanceof z.ZodString) {
    return { type: 'string' };
  } else if (field instanceof z.ZodNumber) {
    return { type: 'number' };
  } else if (field instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  } else if (field instanceof z.ZodEnum) {
    return { 
      type: 'string',
      enum: field.options 
    };
  } else if (field instanceof z.ZodOptional) {
    return getFieldSchema(field.unwrap());
  } else if (field instanceof z.ZodDefault) {
    return getFieldSchema(field._def.innerType);
  } else if (field instanceof z.ZodObject) {
    return zodToJsonSchema(field);
  } else {
    return { type: 'string' };
  }
}

export function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'shopify-checkout-branding',
      version: '2.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define tools with COMPREHENSIVE and ACCURATE descriptions
  const tools: Tool[] = [
    {
      name: 'shopify_list_checkout_profiles',
      description: `List all checkout profiles in a Shopify Plus store. Returns both TEST/draft and PUBLISHED/live profiles with their IDs, names, and publication status. 
      
      Use this to:
      - Identify available checkout profiles before making updates
      - Find the TEST profile ID for safe testing (isPublished: false)
      - Find the PRODUCTION profile ID for live updates (isPublished: true)
      
      Note: Most stores have 2 profiles - one TEST and one PUBLISHED. Always prefer updating TEST profile first.`,
      inputSchema: zodToJsonSchema(listCheckoutProfilesInputSchema),
    },
    {
      name: 'shopify_get_checkout_branding',
      description: `Retrieve complete checkout branding configuration including design system and customizations.
      
      Returns two main sections:
      1. DESIGN SYSTEM: Foundation settings for colors, typography, corner radius
         - colors.global.brand: The PRIMARY BUTTON COLOR
         - colors.schemes: Detailed color schemes with primaryButton, secondaryButton, control colors
         - typography: Font families and sizes
      
      2. CUSTOMIZATIONS: Specific UI element settings
         - HEADER: Logo (visibility, maxWidth), banner image, cartLink (contentType, image), divided, alignment, padding
         - FOOTER: Content visibility, color scheme, padding
         - MAIN: Background image, section styling, divider settings
         - ORDER SUMMARY: Background image, section styling, divider settings
         - primaryButton, secondaryButton, control, textField, select elements
      
      The profileId is optional - defaults to TEST profile for safety.`,
      inputSchema: zodToJsonSchema(getCheckoutBrandingInputSchema),
    },
    {
      name: 'shopify_update_checkout_branding',
      description: `Update checkout branding using Shopify's CheckoutBrandingUpsert API. 
      
      🔒 SAFETY: Defaults to TEST/draft profile unless useProductionProfile:true or explicit profileId provided.
      
      🎨 PRIMARY BUTTON COLOR:
      The primary button (Pay Now) color is controlled by:
      • globalBrand: Sets the brand color (EASIEST - just pass hex color)
      • OR designSystem.colors.global.brand: Same as above but in full structure
      • OR designSystem.colors.schemes.scheme1.primaryButton: For detailed control including hover states
      • NOT colors.primary - this field is deprecated, use globalBrand instead
      
      📚 COMPREHENSIVE CAPABILITIES:
      
      DESIGN SYSTEM (Foundation):
      • GLOBAL COLORS:
        - brand: Primary buttons and brand elements (#FF6B00 for orange)
        - accent: Links and focus states
        - success, warning, critical, info: Semantic colors
        - decorative: Highlight colors
      • COLOR SCHEMES (scheme1-4): Each can have:
        - base: Background, text, border, icon, accent colors
        - primaryButton: Background, text, hover state colors
        - secondaryButton: Secondary action button colors
        - control: Form field colors with selected state
      • TYPOGRAPHY:
        - primary/secondary fonts (e.g., "Assistant", "Roboto", "Montserrat")
        - Font weights, sizes, letter spacing
        - Size base (12-18px) and ratio (1.0-1.5)
      • CORNER RADIUS: Variables for small, base, large radii
      
      CUSTOMIZATIONS (Specific Elements):
      • HEADER:
        - Logo: position, width (50-500px), visibility (VISIBLE/HIDDEN)
        - Banner: background image via mediaImageId
        - CartLink: contentType (ICON/IMAGE/TEXT), custom image
        - Alignment, divided (true/false), padding, color scheme
        - Position mapping: LEFT→START, CENTER→INLINE, RIGHT→INLINE_SECONDARY
      • FOOTER: 
        - Content visibility, color scheme
        - padding: NONE|BASE|BASE_500|SMALL|SMALL_100-500|LARGE|LARGE_100-500 (section values)
      • MAIN AREA:
        - Section: 
          * background: BASE|SUBDUED|TRANSPARENT (accepts SOLID→BASE, NONE→TRANSPARENT)
          * shadow: SMALL_100|SMALL_200|BASE|LARGE_100|LARGE_200 (NO 'NONE' or 'BASE_200'!)
          * cornerRadius: NONE|SMALL|BASE|LARGE
          * padding: NONE|BASE|BASE_500|SMALL|SMALL_100-500|LARGE|LARGE_100-500 (NOT button values!)
          * border: NONE|FULL
          * borderWidth: BASE|LARGE|LARGE_100|LARGE_200 (NOT 'NONE' or 'MEDIUM'!)
        - Background image via mediaImageId
        - Divider: borderStyle (BASE/DASHED/DOTTED), borderWidth (BASE|LARGE|LARGE_100|LARGE_200), visibility
        - Color scheme: COLOR_SCHEME1|COLOR_SCHEME2|COLOR_SCHEME3|COLOR_SCHEME4
      • ORDER SUMMARY:
        - Section: Same exact values as main area
        - Background image support
        - Independent divider settings with visibility
        - Separate color scheme
      • CONTENT:
        - Divider: borderStyle, borderWidth, visibility (container divider)
      • GLOBAL DIVIDER:
        - borderStyle (BASE/DASHED/DOTTED), borderWidth (NONE/BASE/MEDIUM)
        - Note: NO visibility on global divider (customizations.divider)
      • BUTTONS:
        - primaryButton/secondaryButton:
          * background: NONE|SOLID
          * border: NONE|FULL
          * cornerRadius: NONE|SMALL|BASE|LARGE
          * blockPadding/inlinePadding: NONE|EXTRA_TIGHT|TIGHT|BASE|LOOSE|EXTRA_LOOSE
          * typography: font, size, weight (BASE|BOLD), kerning, letterCase (NONE|LOWER|TITLE|UPPER)
      • FORM CONTROLS:
        - border: NONE|FULL (exactly these two)
        - color: TRANSPARENT (ONLY this value accepted!)
        - cornerRadius: NONE|SMALL|BASE|LARGE
        - labelPosition: INSIDE|OUTSIDE
      • TEXT FIELDS & SELECTS: Border, typography styling
      • CHECKBOXES: Corner radius
      • HEADINGS: Typography for 3 levels
      • MERCHANDISE THUMBNAILS: Corner radius, border
      • EXPRESS CHECKOUT: Button corner radius
      • OTHER: Choice lists, buyer journey, cart link, dividers, content borders
      
      SIMPLIFIED OPTIONS (for convenience):
      • colors: {background, text, primary→brand, surface} - Legacy support
      • globalBrand: Direct way to set primary button color
      • primaryButtonColor: Override primary button background
      • typography: Simplified font settings
      • logoPosition, logoWidth, imageId: Direct logo control
      
      USAGE EXAMPLES:
      1. Set orange primary button: globalBrand: "#FF6B00"
      2. Full brand colors: designSystem.colors.global.brand: "#FF6B00"
      3. Detailed button control: designSystem.colors.schemes.scheme1.primaryButton.background: "#FF6B00"
      
      API NOTES & CRITICAL ENUM VALUES:
      - SHADOW: ONLY 5 valid values: SMALL_100, SMALL_200, BASE, LARGE_100, LARGE_200
        * NO 'NONE' (use SMALL_100), NO 'BASE_200' (use LARGE_100)
      - BACKGROUND: BASE, SUBDUED, TRANSPARENT (NOT 'SOLID' or 'NONE')
        * Tool maps SOLID→BASE, NONE→TRANSPARENT automatically
      - PADDING: Sections use different values than buttons!
        * Sections: NONE|BASE|BASE_500|SMALL|SMALL_100-500|LARGE|LARGE_100-500
        * Buttons: NONE|EXTRA_TIGHT|TIGHT|BASE|LOOSE|EXTRA_LOOSE
      - BORDERWIDTH: Different for sections vs global divider!
        * Sections/container dividers: BASE|LARGE|LARGE_100|LARGE_200 (NO 'MEDIUM')
        * Global divider: NONE|BASE|MEDIUM
      - DIVIDERS: Global (customizations.divider) has NO visibility field
        * Container dividers (main.divider, orderSummary.divider) DO have visibility
      - letterCase: UPPER not UPPERCASE
      - globalCornerRadius: ONLY accepts NONE (API limitation)
      - control.color: ONLY accepts TRANSPARENT (API limitation)
      - Position: LEFT→START, CENTER→INLINE, RIGHT→INLINE_SECONDARY
      - Changes to TEST profile can be previewed
      - PUBLISHED profile changes are immediately live`,
      inputSchema: zodToJsonSchema(updateCheckoutBrandingInputSchema),
    },
    {
      name: 'shopify_upload_logo_from_url',
      description: `Upload a logo image from a public HTTPS URL to Shopify Files for use in checkout branding.
      
      Process:
      1. Downloads image from provided URL
      2. Uploads to Shopify's CDN via staged upload
      3. Returns imageId to use with shopify_update_checkout_branding
      
      Requirements:
      - URL must be publicly accessible (no authentication)
      - URL must use HTTPS protocol
      - Supported formats: PNG, JPG, WEBP (not SVG for checkout logos)
      - Recommended dimensions: 200-600px width, maintain aspect ratio
      
      Use the returned imageId with shopify_update_checkout_branding to apply the logo.
      
      Example workflow:
      1. Upload logo: shopify_upload_logo_from_url(url: "https://example.com/logo.png")
      2. Apply to checkout: shopify_update_checkout_branding(imageId: returned_id, logoWidth: 150)`,
      inputSchema: zodToJsonSchema(uploadLogoFromUrlInputSchema),
    },
    {
      name: 'shopify_upload_custom_font_from_url',
      description: `Upload a custom font from a public HTTPS URL to Shopify Files for use in checkout branding.
      
      🎨 CUSTOM FONTS ENABLE UNIQUE TYPOGRAPHY:
      Custom fonts allow merchants to use their brand's specific typeface in checkout, creating a cohesive brand experience.
      
      📋 REQUIREMENTS:
      - Font must be in WOFF, WOFF2, TTF, or OTF format (WOFF2 recommended for best performance)
      - URL must be publicly accessible (no authentication)
      - URL must use HTTPS protocol
      - Store must have appropriate webfont license for commercial use
      
      🔄 PROCESS:
      1. Downloads font from provided URL
      2. Uploads to Shopify's CDN as a generic file
      3. Returns genericFileId to use with checkout branding
      
      ⚙️ PARAMETERS:
      - url: HTTPS URL of the font file (required)
      - filename: Optional custom filename (auto-extracted from URL if not provided)
      - mimeType: Optional MIME type (auto-detected from extension: woff2, woff, ttf, otf)
      - fontWeight: Optional weight value 100-900 (default: 400 for regular, 700 for bold)
      - isBold: Optional boolean to mark as bold variant (sets weight to 700)
      
      💡 USAGE WITH CHECKOUT BRANDING:
      After uploading, use the returned genericFileId in shopify_update_checkout_branding:
      
      Example for primary font (body text):
      {
        "designSystem": {
          "typography": {
            "primary": {
              "customFontGroup": {
                "base": {
                  "genericFileId": "returned_id",
                  "weight": 400
                },
                "bold": {
                  "genericFileId": "returned_bold_id",
                  "weight": 700
                },
                "loadingStrategy": "SWAP"
              }
            }
          }
        }
      }
      
      Example for secondary font (headings):
      {
        "designSystem": {
          "typography": {
            "secondary": {
              "customFontGroup": {
                "base": {
                  "genericFileId": "returned_id",
                  "weight": 400
                },
                "bold": {
                  "genericFileId": "returned_bold_id",
                  "weight": 700
                }
              }
            }
          }
        }
      }
      
      🚀 LOADING STRATEGIES:
      - BLOCK: Block text rendering until font loads (not recommended)
      - SWAP: Show fallback font immediately, swap when custom font loads (recommended)
      - FALLBACK: Short block period, then fallback if not loaded
      - OPTIONAL: Very short block period, may not swap if slow to load
      
      📝 COMPLETE WORKFLOW:
      1. Upload regular font: shopify_upload_custom_font_from_url(url: "https://example.com/myfont-regular.woff2")
      2. Upload bold font: shopify_upload_custom_font_from_url(url: "https://example.com/myfont-bold.woff2", isBold: true)
      3. Apply to checkout: shopify_update_checkout_branding with customFontGroup configuration`,
      inputSchema: zodToJsonSchema(uploadCustomFontFromUrlInputSchema),
    },
  ];

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      const shopify = new ShopifyClient();
      const brandingService = new BrandingService(shopify);
      
      let result: any;
      
      switch (name) {
        case 'shopify_list_checkout_profiles': {
          listCheckoutProfilesInputSchema.parse(args || {});
          const profiles = await brandingService.listProfiles();
          result = { profiles };
          break;
        }
        
        case 'shopify_get_checkout_branding': {
          const input = getCheckoutBrandingInputSchema.parse(args || {});
          result = await brandingService.getBranding(input.profileId);
          break;
        }
        
        case 'shopify_update_checkout_branding': {
          const input = updateCheckoutBrandingInputSchema.parse(args || {});
          result = await brandingService.upsertBranding(input);
          break;
        }
        
        case 'shopify_upload_logo_from_url': {
          const input = uploadLogoFromUrlInputSchema.parse(args || {});
          result = await brandingService.uploadLogoFromUrl(input);
          break;
        }
        
        case 'shopify_upload_custom_font_from_url': {
          const input = uploadCustomFontFromUrlInputSchema.parse(args || {});
          result = await brandingService.uploadCustomFontFromUrl(input);
          break;
        }
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
      };
    }
  });

  return server;
}

// Start the server if this is the main module
export async function startMCPServer() {
  const server = createMCPServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

import { ShopifyClient, QUERIES, MUTATIONS } from './shopify.js';
import { 
  UpdateCheckoutBrandingInput,
  ListCheckoutProfilesOutput,
  GetCheckoutBrandingOutput,
  UploadLogoFromUrlOutput
} from './schemas.js';
import { createLogger } from './logging.js';

const logger = createLogger('branding');

export class BrandingService {
  constructor(private shopify: ShopifyClient) {}

  async listProfiles(): Promise<ListCheckoutProfilesOutput['profiles']> {
    const response = await this.shopify.gql<{
      checkoutProfiles: {
        nodes: Array<{
          id: string;
          name: string | null;
          isPublished: boolean;
        }>;
      };
    }>(QUERIES.LIST_PROFILES);
    
    // Map isPublished for backward compatibility
    return response.checkoutProfiles.nodes.map(node => ({
      id: node.id,
      name: node.name,
      isPublished: node.isPublished === true, // Ensure boolean
    }));
  }

  async getBranding(profileId?: string): Promise<GetCheckoutBrandingOutput> {
    // If no profileId provided, find TEST profile by default
    if (!profileId) {
      const profiles = await this.listProfiles();
      const testProfile = profiles.find((p: { isPublished: boolean }) => !p.isPublished);
      if (!testProfile) {
        throw new Error('No TEST/draft profile found');
      }
      profileId = testProfile.id;
    }

    const response = await this.shopify.gql<{
      checkoutBranding: any;
    }>(QUERIES.GET_BRANDING, { checkoutProfileId: profileId });
    const branding = response.checkoutBranding;
    
    if (!branding) {
      return {
        header: {
          logo: {}
        },
        colors: {}
      };
    }

    // Build comprehensive response with backward compatibility
    const result: GetCheckoutBrandingOutput = {
      // Full design system data
      designSystem: branding.designSystem || {},
      customizations: branding.customizations || {},
      
      // Simplified view for backward compatibility
      header: {
        logo: {
          width: branding.customizations?.header?.logo?.maxWidth,
          position: this.mapHeaderPositionToLegacy(
            branding.customizations?.header?.position
          ),
          image: branding.customizations?.header?.logo?.image
        }
      },
      colors: {
        // Map from design system colors if available
        background: branding.designSystem?.colors?.schemes?.scheme1?.base?.background,
        text: branding.designSystem?.colors?.schemes?.scheme1?.base?.text,
        primary: branding.designSystem?.colors?.global?.brand, // Primary button uses brand
        surface: branding.designSystem?.colors?.schemes?.scheme1?.base?.background,
      }
    };

    return result;
  }

  async upsertBranding(input: UpdateCheckoutBrandingInput): Promise<GetCheckoutBrandingOutput> {
    let profileId = input.profileId;
    
    // Auto-select profile based on safety settings
    if (!profileId) {
      const profiles = await this.listProfiles();
      if (input.useProductionProfile) {
        // Find PUBLISHED profile
        const prodProfile = profiles.find((p: { isPublished: boolean }) => p.isPublished);
        if (!prodProfile) {
          throw new Error('No PUBLISHED/production profile found');
        }
        profileId = prodProfile.id;
        logger.info({ profileId }, 'Using PRODUCTION profile');
      } else {
        // Default to TEST profile (safety first)
        const testProfile = profiles.find((p: { isPublished: boolean }) => !p.isPublished);
        if (!testProfile) {
          throw new Error('No TEST/draft profile found');
        }
        profileId = testProfile.id;
        logger.info({ profileId }, 'Using TEST profile (default)');
      }
    }

    // Build the checkoutBrandingInput
    const brandingInput: any = {};
    
    // =========================================
    // DESIGN SYSTEM
    // =========================================
    if (input.designSystem || input.colors || input.globalBrand || input.primaryButtonColor || input.typography) {
      brandingInput.designSystem = {};
      
      // Colors
      if (input.designSystem?.colors || input.colors || input.globalBrand || input.primaryButtonColor) {
        brandingInput.designSystem.colors = {};
        
        // Global colors
        if (input.designSystem?.colors?.global || input.globalBrand || input.colors?.primary) {
          brandingInput.designSystem.colors.global = {
            ...input.designSystem?.colors?.global,
            // Map legacy colors.primary to global.brand (this is what controls primary buttons!)
            brand: input.globalBrand || input.colors?.primary || input.designSystem?.colors?.global?.brand,
          };
        }
        
        // Color schemes
        if (input.designSystem?.colors?.schemes || input.primaryButtonColor || input.colors) {
          brandingInput.designSystem.colors.schemes = input.designSystem?.colors?.schemes || {};
          
          // Set up scheme1 if we have simple colors or primaryButtonColor
          if (input.colors || input.primaryButtonColor) {
            if (!brandingInput.designSystem.colors.schemes.scheme1) {
              brandingInput.designSystem.colors.schemes.scheme1 = {};
            }
            
            // Base colors for scheme1
            if (input.colors) {
              brandingInput.designSystem.colors.schemes.scheme1.base = {
                background: input.colors.background,
                text: input.colors.text,
              };
            }
            
            // Primary button specific color override
            if (input.primaryButtonColor) {
              brandingInput.designSystem.colors.schemes.scheme1.primaryButton = {
                background: input.primaryButtonColor,
                text: input.colors?.primaryText || '#FFFFFF',
              };
            }
          }
        }
      }
      
      // Typography
      if (input.designSystem?.typography || input.typography) {
        brandingInput.designSystem.typography = {};
        
        // Handle simplified typography input
        if (input.typography) {
          if (input.typography.primaryFont) {
            brandingInput.designSystem.typography.primary = {
              shopifyFontGroup: {
                name: input.typography.primaryFont
              }
            };
          }
          
          if (input.typography.secondaryFont) {
            brandingInput.designSystem.typography.secondary = {
              shopifyFontGroup: {
                name: input.typography.secondaryFont
              }
            };
          }
          
          if (input.typography.size) {
            brandingInput.designSystem.typography.size = input.typography.size;
          }
        }
        
        // Merge with full designSystem typography if provided
        if (input.designSystem?.typography) {
          brandingInput.designSystem.typography = {
            ...brandingInput.designSystem.typography,
            ...input.designSystem.typography
          };
        }
      }
      
      // Corner radius
      if (input.designSystem?.cornerRadius) {
        brandingInput.designSystem.cornerRadius = input.designSystem.cornerRadius;
      }
    }
    
    // =========================================
    // CUSTOMIZATIONS
    // =========================================
    if (input.customizations || input.logoPosition || input.logoWidth || input.imageId) {
      brandingInput.customizations = input.customizations || {};
      
      // Process main section background mapping
      if (brandingInput.customizations.main?.section?.background) {
        brandingInput.customizations.main.section.background = 
          this.mapBackgroundValue(brandingInput.customizations.main.section.background);
      }
      
      // Process main section shadow mapping
      if (brandingInput.customizations.main?.section?.shadow) {
        brandingInput.customizations.main.section.shadow = 
          this.mapShadowValue(brandingInput.customizations.main.section.shadow);
      }
      
      // Process order summary section background mapping
      if (brandingInput.customizations.orderSummary?.section?.background) {
        brandingInput.customizations.orderSummary.section.background = 
          this.mapBackgroundValue(brandingInput.customizations.orderSummary.section.background);
      }
      
      // Process order summary section shadow mapping
      if (brandingInput.customizations.orderSummary?.section?.shadow) {
        brandingInput.customizations.orderSummary.section.shadow = 
          this.mapShadowValue(brandingInput.customizations.orderSummary.section.shadow);
      }
      
      // Process footer padding mapping
      if (brandingInput.customizations.footer?.padding) {
        brandingInput.customizations.footer.padding = 
          this.mapSectionPaddingValue(brandingInput.customizations.footer.padding);
      }
      
      // Process main section padding mapping
      if (brandingInput.customizations.main?.section?.padding) {
        brandingInput.customizations.main.section.padding = 
          this.mapSectionPaddingValue(brandingInput.customizations.main.section.padding);
      }
      
      // Process order summary section padding mapping
      if (brandingInput.customizations.orderSummary?.section?.padding) {
        brandingInput.customizations.orderSummary.section.padding = 
          this.mapSectionPaddingValue(brandingInput.customizations.orderSummary.section.padding);
      }
      
      // Process borderWidth mappings for sections and dividers
      if (brandingInput.customizations.main?.section?.borderWidth) {
        brandingInput.customizations.main.section.borderWidth = 
          this.mapBorderWidthValue(brandingInput.customizations.main.section.borderWidth);
      }
      
      if (brandingInput.customizations.main?.divider?.borderWidth) {
        brandingInput.customizations.main.divider.borderWidth = 
          this.mapBorderWidthValue(brandingInput.customizations.main.divider.borderWidth);
      }
      
      if (brandingInput.customizations.orderSummary?.section?.borderWidth) {
        brandingInput.customizations.orderSummary.section.borderWidth = 
          this.mapBorderWidthValue(brandingInput.customizations.orderSummary.section.borderWidth);
      }
      
      if (brandingInput.customizations.orderSummary?.divider?.borderWidth) {
        brandingInput.customizations.orderSummary.divider.borderWidth = 
          this.mapBorderWidthValue(brandingInput.customizations.orderSummary.divider.borderWidth);
      }
      
      // Handle legacy logo fields
      if (input.logoPosition || input.logoWidth || input.imageId) {
        if (!brandingInput.customizations.header) {
          brandingInput.customizations.header = {};
        }
        
        if (input.logoPosition) {
          brandingInput.customizations.header.position = this.mapLogoPosition(input.logoPosition);
        }
        
        if (input.logoWidth || input.imageId) {
          if (!brandingInput.customizations.header.logo) {
            brandingInput.customizations.header.logo = {};
          }
          
          if (input.logoWidth) {
            brandingInput.customizations.header.logo.maxWidth = input.logoWidth;
          }
          
          if (input.imageId) {
            brandingInput.customizations.header.logo.image = {
              mediaImageId: input.imageId
            };
          }
        }
      }
    }
    
    // Pass null if no branding input to reset to defaults
    const checkoutBrandingInput = Object.keys(brandingInput).length > 0 ? brandingInput : null;
    
    const response = await this.shopify.gql<{
      checkoutBrandingUpsert: {
        checkoutBranding: any;
        userErrors: Array<{
          field?: string[];
          message: string;
        }>;
      };
    }>(MUTATIONS.UPSERT_BRANDING, {
      checkoutProfileId: profileId,
      checkoutBrandingInput
    });
    
    if (response.checkoutBrandingUpsert?.userErrors?.length > 0) {
      const errors = response.checkoutBrandingUpsert.userErrors
        .map(e => `${e.field?.join('.')}: ${e.message}`)
        .join(', ');
      throw new Error(`Branding update failed: ${errors}`);
    }
    
    // Return the updated branding
    return this.getBranding(profileId);
  }
  
  async uploadLogoFromUrl(input: { url: string; filename?: string; mimeType?: string }): Promise<UploadLogoFromUrlOutput> {
    // Extract filename from URL if not provided
    const filename = input.filename || input.url.split('/').pop() || 'logo.png';
    const mimeType = input.mimeType || 'image/png';
    
    // Step 1: Create staged upload
    const stagedUploadResponse = await this.shopify.gql<{
      stagedUploadsCreate: {
        stagedTargets: Array<{
          url: string;
          resourceUrl: string;
          parameters: Array<{
            name: string;
            value: string;
          }>;
        }>;
        userErrors: Array<{
          field?: string[];
          message: string;
        }>;
      };
    }>(QUERIES.STAGED_UPLOAD_CREATE, {
      input: [{
        resource: 'FILE',
        filename,
        mimeType,
        httpMethod: 'POST'
      }]
    });
    
    if (stagedUploadResponse.stagedUploadsCreate?.userErrors?.length > 0) {
      const errors = stagedUploadResponse.stagedUploadsCreate.userErrors
        .map(e => `${e.field?.join('.')}: ${e.message}`)
        .join(', ');
      throw new Error(`Staged upload failed: ${errors}`);
    }
    
    const target = stagedUploadResponse.stagedUploadsCreate.stagedTargets[0];
    
    // Step 2: Download image from URL
    const imageResponse = await fetch(input.url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image from URL: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Step 3: Upload to Shopify's staged URL
    const formData = new FormData();
    target.parameters.forEach(param => {
      formData.append(param.name, param.value);
    });
    formData.append('file', new Blob([imageBuffer], { type: mimeType }), filename);
    
    const uploadResponse = await fetch(target.url, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file to Shopify: ${uploadResponse.statusText}`);
    }
    
    // Step 4: Create file in Shopify
    const fileCreateResponse = await this.shopify.gql<{
      fileCreate: {
        files: Array<{
          id: string;
          alt?: string;
          image?: {
            id: string;
            url: string;
          };
        }>;
        userErrors: Array<{
          field?: string[];
          message: string;
        }>;
      };
    }>(QUERIES.CREATE_FILE, {
      files: [{
        contentType: 'IMAGE',
        originalSource: target.resourceUrl,
        alt: filename
      }]
    });
    
    if (fileCreateResponse.fileCreate?.userErrors?.length > 0) {
      const errors = fileCreateResponse.fileCreate.userErrors
        .map(e => `${e.field?.join('.')}: ${e.message}`)
        .join(', ');
      throw new Error(`File creation failed: ${errors}`);
    }
    
    const file = fileCreateResponse.fileCreate.files[0];
    return {
      imageId: file.id,
      url: file.image?.url || ''
    };
  }
  
  async uploadCustomFontFromUrl(input: {
    url: string;
    filename?: string;
    mimeType?: string;
    fontWeight?: number;
    isBold?: boolean;
  }) {
    // Extract filename from URL if not provided
    const filename = input.filename || input.url.split('/').pop() || 'custom-font.woff2';
    
    // Determine mime type based on file extension if not provided
    let mimeType = input.mimeType;
    if (!mimeType) {
      if (filename.endsWith('.woff2')) {
        mimeType = 'font/woff2';
      } else if (filename.endsWith('.woff')) {
        mimeType = 'font/woff';
      } else if (filename.endsWith('.ttf')) {
        mimeType = 'font/ttf';
      } else if (filename.endsWith('.otf')) {
        mimeType = 'font/otf';
      } else {
        mimeType = 'application/octet-stream';
      }
    }
    
    // Step 1: Create staged upload for generic file
    const stagedUploadResponse = await this.shopify.gql<{
      stagedUploadsCreate: {
        stagedTargets: Array<{
          url: string;
          resourceUrl: string;
          parameters: Array<{
            name: string;
            value: string;
          }>;
        }>;
        userErrors: Array<{
          field?: string[];
          message: string;
        }>;
      };
    }>(QUERIES.STAGED_UPLOAD_CREATE, {
      input: [{
        resource: 'GENERIC_FILE',  // Use GENERIC_FILE for fonts
        filename,
        mimeType,
        httpMethod: 'POST'
      }]
    });
    
    if (stagedUploadResponse.stagedUploadsCreate?.userErrors?.length > 0) {
      const errors = stagedUploadResponse.stagedUploadsCreate.userErrors
        .map(e => `${e.field?.join('.')}: ${e.message}`)
        .join(', ');
      throw new Error(`Staged upload failed: ${errors}`);
    }
    
    const target = stagedUploadResponse.stagedUploadsCreate.stagedTargets[0];
    
    // Step 2: Download font from URL
    const fontResponse = await fetch(input.url);
    if (!fontResponse.ok) {
      throw new Error(`Failed to download font from URL: ${fontResponse.statusText}`);
    }
    const fontBuffer = await fontResponse.arrayBuffer();
    
    // Step 3: Upload to Shopify's staged URL
    const formData = new FormData();
    target.parameters.forEach(param => {
      formData.append(param.name, param.value);
    });
    formData.append('file', new Blob([fontBuffer], { type: mimeType }), filename);
    
    const uploadResponse = await fetch(target.url, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload font file to Shopify: ${uploadResponse.statusText}`);
    }
    
    // Step 4: Create generic file in Shopify
    const fileCreateResponse = await this.shopify.gql<{
      fileCreate: {
        files: Array<{
          id: string;
          alt?: string;
          url?: string;
          fileStatus?: string;
          __typename: string;
        }>;
        userErrors: Array<{
          field?: string[];
          message: string;
        }>;
      };
    }>(QUERIES.CREATE_FILE, {
      files: [{
        contentType: 'GENERIC_FILE',  // GENERIC_FILE for fonts
        originalSource: target.resourceUrl,
        alt: filename
      }]
    });
    
    if (fileCreateResponse.fileCreate?.userErrors?.length > 0) {
      const errors = fileCreateResponse.fileCreate.userErrors
        .map(e => `${e.field?.join('.')}: ${e.message}`)
        .join(', ');
      throw new Error(`File creation failed: ${errors}`);
    }
    
    const file = fileCreateResponse.fileCreate.files[0];
    return {
      genericFileId: file.id,
      url: file.url || '',
      weight: input.fontWeight || (input.isBold ? 700 : 400),
      filename
    };
  }
  
  // Helper to map new position values to legacy ones for backward compatibility
  private mapHeaderPositionToLegacy(position?: string): string | undefined {
    if (!position) return undefined;
    const map: Record<string, string> = {
      'START': 'LEFT',
      'INLINE': 'CENTER',
      'INLINE_SECONDARY': 'RIGHT',
    };
    return map[position] || position;
  }
  
  // Helper to map legacy position values to new API values
  // Map shadow values from incorrect to correct API values
  private mapShadowValue(value?: string): string | undefined {
    if (!value) return undefined;
    
    // Map common mistakes to valid API values
    const shadowMap: Record<string, string> = {
      'NONE': 'SMALL_100',       // No shadow -> smallest shadow
      'BASE_200': 'LARGE_100',   // BASE_200 doesn't exist -> use LARGE_100
      'EXTRA_LARGE_300': 'LARGE_200', // Not valid -> use largest
      // Valid values pass through
      'SMALL_100': 'SMALL_100',
      'SMALL_200': 'SMALL_200', 
      'BASE': 'BASE',
      'LARGE_100': 'LARGE_100',
      'LARGE_200': 'LARGE_200'
    };
    
    return shadowMap[value] || value;
  }
  
  // Map padding values from button spacing to section spacing
  private mapSectionPaddingValue(value?: string): string | undefined {
    if (!value) return undefined;
    
    // Map button padding values to section padding values
    const paddingMap: Record<string, string> = {
      // Button values that don't exist for sections
      'EXTRA_TIGHT': 'SMALL',      // Extra tight -> small
      'TIGHT': 'SMALL_100',        // Tight -> small 100
      'LOOSE': 'LARGE',            // Loose -> large
      'EXTRA_LOOSE': 'LARGE_500',  // Extra loose -> largest
      // Valid values pass through
      'NONE': 'NONE',
      'BASE': 'BASE',
      'BASE_500': 'BASE_500',
      'SMALL': 'SMALL',
      'LARGE': 'LARGE',
    };
    
    // Check if it's already a valid section padding value
    if (value.startsWith('SMALL_') || value.startsWith('LARGE_')) {
      return value;
    }
    
    return paddingMap[value] || value;
  }

  // Map border width values for sections and container dividers
  private mapBorderWidthValue(value?: string): string | undefined {
    if (!value) return undefined;
    
    // Map values for sections/container dividers
    const borderWidthMap: Record<string, string> = {
      'NONE': 'BASE',          // No borderWidth -> use BASE
      'MEDIUM': 'LARGE',       // MEDIUM doesn't exist -> use LARGE
      // Valid values pass through
      'BASE': 'BASE',
      'LARGE': 'LARGE',
      'LARGE_100': 'LARGE_100',
      'LARGE_200': 'LARGE_200'
    };
    
    return borderWidthMap[value] || value;
  }

  // Map background values from user-friendly to API values
  private mapBackgroundValue(value?: string): string | undefined {
    if (!value) return undefined;
    
    // Map user-friendly values to API values
    const backgroundMap: Record<string, string> = {
      'NONE': 'TRANSPARENT',     // NONE -> TRANSPARENT
      'SOLID': 'BASE',           // SOLID -> BASE (most common solid background)
      'BASE': 'BASE',            // Already correct
      'SUBDUED': 'SUBDUED',      // Already correct
      'TRANSPARENT': 'TRANSPARENT', // Already correct
    };
    
    return backgroundMap[value] || value;
  }

  private mapLogoPosition(position: string): string {
    const map: Record<string, string> = {
      'LEFT': 'START',
      'CENTER': 'INLINE',
      'RIGHT': 'INLINE_SECONDARY',
    };
    return map[position] || position;
  }
}

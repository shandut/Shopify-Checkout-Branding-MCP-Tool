import { fetch, type RequestInit } from 'undici';
import { createLogger, logGraphQLOperation } from './logging.js';

const logger = createLogger('shopify');

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: any;
  }>;
}

interface ShopifyApiError extends Error {
  status?: number;
  errors?: any[];
  userErrors?: any[];
}

class ShopifyError extends Error implements ShopifyApiError {
  status?: number;
  errors?: any[];
  userErrors?: any[];

  constructor(message: string, status?: number, errors?: any[], userErrors?: any[]) {
    super(message);
    this.name = 'ShopifyError';
    this.status = status;
    this.errors = errors;
    this.userErrors = userErrors;
  }
}

export class ShopifyClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ADMIN_TOKEN;
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-01';

    if (!domain || !token) {
      throw new Error('Missing required environment variables: SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN');
    }

    this.baseUrl = `https://${domain}/admin/api/${apiVersion}/graphql.json`;
    this.headers = {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    };

    logger.info({ domain, apiVersion }, 'Shopify client initialized');
  }

  async gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const operationMatch = query.match(/^\s*(query|mutation)\s+(\w+)?/i);
    const operationType = operationMatch?.[1]?.toLowerCase() as 'query' | 'mutation' || 'query';
    const operationName = operationMatch?.[2] || 'unnamed';

    logGraphQLOperation(operationType, operationName, variables);

    const maxRetries = 3;
    let attempt = 0;
    let lastError: Error | undefined;

    while (attempt < maxRetries) {
      attempt++;

      try {
        const requestBody = JSON.stringify({ query, variables });
        const requestOptions: RequestInit = {
          method: 'POST',
          headers: this.headers,
          body: requestBody,
        };

        const response = await fetch(this.baseUrl, requestOptions);
        const responseHeaders = response.headers as any;
        
        // Check for rate limiting
        if (response.status === 429) {
          const retryAfter = responseHeaders.get('retry-after') || responseHeaders.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          
          logger.warn({ attempt, waitTime, operation: operationName }, 'Rate limited, retrying...');
          
          if (attempt < maxRetries) {
            await this.sleep(waitTime);
            continue;
          } else {
            throw new ShopifyError('Rate limit exceeded after max retries', 429);
          }
        }

        // Parse response
        const responseText = await response.text();
        let responseData: GraphQLResponse<T>;

        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          logger.error({ responseText, status: response.status }, 'Failed to parse Shopify response');
          throw new ShopifyError(`Invalid JSON response from Shopify: ${responseText}`, response.status);
        }

        // Check for HTTP errors
        if (!response.ok) {
          throw new ShopifyError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            responseData.errors
          );
        }

        // Check for GraphQL errors
        if (responseData.errors && responseData.errors.length > 0) {
          const errorMessage = responseData.errors.map(e => e.message).join(', ');
          logger.error({ errors: responseData.errors, operation: operationName }, 'GraphQL errors');
          throw new ShopifyError(errorMessage, 200, responseData.errors);
        }

        // Check for mutation user errors
        if (operationType === 'mutation' && responseData.data) {
          const mutationResult = Object.values(responseData.data)[0] as any;
          if (mutationResult?.userErrors?.length > 0) {
            logger.warn({ userErrors: mutationResult.userErrors, operation: operationName }, 'Mutation user errors');
            // Don't throw for user errors, return them as part of the data
          }
        }

        if (!responseData.data) {
          throw new ShopifyError('No data in response', 200);
        }

        logger.debug({ operation: operationName, attempt }, 'GraphQL operation successful');
        return responseData.data;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain errors
        if (error instanceof ShopifyError && error.status && error.status >= 400 && error.status < 429) {
          throw error;
        }

        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          logger.warn({ error: lastError.message, attempt, waitTime }, 'Retrying after error');
          await this.sleep(waitTime);
        } else {
          logger.error({ error: lastError.message, attempts: attempt }, 'Max retries exceeded');
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Unexpected error in GraphQL request');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// GraphQL Queries and Mutations
export const QUERIES = {
  LIST_PROFILES: `
    query ListCheckoutProfiles {
      checkoutProfiles(first: 50) {
        nodes {
          id
          name
          isPublished
        }
      }
    }
  `,

  GET_BRANDING: `
    query GetCheckoutBranding($checkoutProfileId: ID!) {
      checkoutBranding(checkoutProfileId: $checkoutProfileId) {
        designSystem {
          colors {
            global {
              brand
              accent
              critical
              decorative
              info
              success
              warning
            }
            schemes {
              scheme1 {
                base {
                  background
                  text
                  border
                  icon
                  accent
                  decorative
                }
                control {
                  background
                  text
                  border
                  icon
                  selected {
                    background
                    text
                    border
                    icon
                  }
                  accent
                }
              }
              scheme2 {
                base {
                  background
                  text
                }
                control {
                  background
                  text
                  accent
                }
              }
            }
            global {
              success
              info
              warning
              critical
            }
          }
          typography {
            size {
              base
              ratio
            }
            primary {
              name
              base {
                weight
              }
              bold {
                weight
              }
            }
            secondary {
              name
              base {
                weight
              }
              bold {
                weight
              }
            }
          }
        }
        customizations {
          global {
            cornerRadius
            typography {
              letterCase
              kerning
            }
          }
          main {
            section {
              cornerRadius
              colorScheme
              shadow
              padding
              border
            }
          }
          orderSummary {
            section {
              cornerRadius
              colorScheme
              shadow
              padding
              border
            }
          }
          header {
            alignment
            banner {
              image {
                id
                url
              }
            }
            logo {
              image {
                id
                url
              }
              maxWidth
            }
            position
          }
        }
      }
    }
  `,

  STAGED_UPLOAD_CREATE: `
    mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `,

  GET_STAGED_UPLOAD_TARGETS: `
    mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `,

  CREATE_FILE: `
    mutation FileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          alt
          ... on MediaImage {
            image {
              id
              url
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
};

export const MUTATIONS = {
  UPSERT_BRANDING: `
    mutation CheckoutBrandingUpsert($checkoutProfileId: ID!, $checkoutBrandingInput: CheckoutBrandingInput) {
      checkoutBrandingUpsert(checkoutProfileId: $checkoutProfileId, checkoutBrandingInput: $checkoutBrandingInput) {
        checkoutBranding {
          designSystem {
            colors {
              global {
                brand
                accent
                critical
                decorative
                info
                success
                warning
              }
              schemes {
                scheme1 {
                  base {
                    background
                    text
                  }
                  control {
                    background
                    text
                    accent
                    selected {
                      background
                      text
                    }
                  }
                }
                scheme2 {
                  base {
                    background
                    text
                  }
                  control {
                    background
                    text
                    accent
                  }
                }
              }
            }
            typography {
              size {
                base
                ratio
              }
              primary {
                name
                base {
                  weight
                }
                bold {
                  weight
                }
              }
              secondary {
                name
                base {
                  weight
                }
                bold {
                  weight
                }
              }
            }
          }
          customizations {
            global {
              cornerRadius
            }
            main {
              section {
                cornerRadius
                colorScheme
                shadow
                padding
                border
              }
            }
            orderSummary {
              section {
                cornerRadius
                colorScheme
                shadow
                padding
                border
              }
            }
            header {
              logo {
                image {
                  id
                  url
                }
                maxWidth
              }
              position
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
};

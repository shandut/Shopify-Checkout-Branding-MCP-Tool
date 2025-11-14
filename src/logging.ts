import pino from 'pino';

// Determine if running as MCP server (no PORT means MCP mode)
const isMCPMode = !process.env.PORT;

// Create logger with security redaction
// In MCP mode, use silent logging or stderr to avoid interfering with stdio protocol
export const logger = pino({
  level: isMCPMode ? 'silent' : (process.env.LOG_LEVEL || 'info'),
  // Only use pretty transport in HTTP mode
  ...((!isMCPMode && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:standard',
      },
    },
  })),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-shopify-access-token"]',
      'headers.X-Shopify-Access-Token',
      'env.SHOPIFY_ADMIN_TOKEN',
      'SHOPIFY_ADMIN_TOKEN',
      'token',
      'accessToken',
      'adminToken',
      '*.token',
      '*.accessToken',
    ],
    censor: '[REDACTED]',
  },
});

// Helper function to log GraphQL operations without sensitive data
export function logGraphQLOperation(
  operationType: 'query' | 'mutation',
  operationName: string,
  variables?: Record<string, any>
): void {
  const safeVariables = variables
    ? Object.keys(variables).reduce((acc, key) => {
        if (key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
          acc[key] = '[REDACTED]';
        } else {
          acc[key] = typeof variables[key] === 'object' ? '[object]' : variables[key];
        }
        return acc;
      }, {} as Record<string, any>)
    : undefined;

  logger.debug({
    type: 'graphql',
    operation: operationType,
    name: operationName,
    variables: safeVariables,
  });
}

// Export a child logger factory for module-specific loggers
export function createLogger(module: string) {
  return logger.child({ module });
}

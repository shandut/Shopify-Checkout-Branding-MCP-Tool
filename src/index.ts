import 'dotenv/config';
import { startMCPServer } from './mcpServer.js';
import { startHttpServer } from './httpServer.js';
import { createLogger } from './logging.js';

const logger = createLogger('main');

async function main() {
  try {
    // Check if HTTP mode is requested
    const httpPort = process.env.PORT ? parseInt(process.env.PORT) : undefined;
    const isMCPMode = !httpPort;
    
    // Validate environment variables
    const requiredEnvVars = ['SHOPIFY_STORE_DOMAIN', 'SHOPIFY_ADMIN_TOKEN'];
    const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missingEnvVars.length > 0) {
      if (!isMCPMode) {
        logger.error({ missing: missingEnvVars }, 'Missing required environment variables');
        logger.info('Please create a .env file based on env.template and fill in the required values');
      }
      // In MCP mode, return error through the protocol, not console
      process.exit(1);
    }

    if (httpPort) {
      // Start HTTP server - logging is OK here
      logger.info({
        store: process.env.SHOPIFY_STORE_DOMAIN,
        apiVersion: process.env.SHOPIFY_API_VERSION || '2026-01',
      }, 'Starting Shopify Checkout Branding MCP Tool in HTTP mode');
      
      logger.info({ port: httpPort }, 'Starting HTTP server');
      await startHttpServer(httpPort);
      
      // Keep the process running
      process.on('SIGINT', () => {
        logger.info('Shutting down HTTP server');
        process.exit(0);
      });
    } else {
      // Start MCP server on stdio - NO LOGGING
      await startMCPServer();
    }
  } catch (error) {
    if (process.env.PORT) {
      logger.error({ error: error instanceof Error ? error.message : error }, 'Failed to start server');
    }
    // Exit silently in MCP mode to avoid corrupting stdio
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  if (process.env.PORT) {
    logger.error({ error: error.message }, 'Uncaught exception');
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  if (process.env.PORT) {
    logger.error({ reason }, 'Unhandled rejection');
  }
  process.exit(1);
});

// Run main function
main().catch((error) => {
  if (process.env.PORT) {
    logger.error({ error: error instanceof Error ? error.message : error }, 'Fatal error');
  }
  process.exit(1);
});

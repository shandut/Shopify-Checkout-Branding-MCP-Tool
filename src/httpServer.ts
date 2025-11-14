import Fastify, { FastifyInstance } from 'fastify';
import { BrandingService } from './branding.js';
import { ShopifyClient } from './shopify.js';
import { createLogger } from './logging.js';
import {
  profileIdSchema,
  updateCheckoutBrandingInputSchema,
  uploadLogoFromUrlInputSchema,
} from './schemas.js';
import { z } from 'zod';

const logger = createLogger('http-server');

export async function createHttpServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: false, // We use our own logger
  });
  
  // Create service instances
  const shopify = new ShopifyClient();
  const brandingService = new BrandingService(shopify);

  // Enable CORS for development
  await fastify.register(import('@fastify/cors'), {
    origin: true,
    credentials: true,
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', service: 'shopify-checkout-branding' };
  });

  // List checkout profiles
  fastify.get('/profiles', async (_request, reply) => {
    try {
      const result = await brandingService.listProfiles();
      return result;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : error }, 'Failed to list profiles');
      
      if (error instanceof Error && error.message.includes('429')) {
        reply.code(429);
        return { error: 'Rate limited. Please try again later.' };
      }
      
      reply.code(500);
      return { error: error instanceof Error ? error.message : 'Internal server error' };
    }
  });

  // Get checkout branding
  fastify.get<{
    Params: { id: string };
  }>('/profiles/:id/branding', async (request, reply) => {
    try {
      // Validate profile ID
      const profileId = profileIdSchema.parse(request.params.id);
      const result = await brandingService.getBranding(profileId);
      return result;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : error }, 'Failed to get branding');
      
      if (error instanceof z.ZodError) {
        reply.code(400);
        return { 
          error: 'Validation error',
          details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        };
      }
      
      if (error instanceof Error && error.message.includes('429')) {
        reply.code(429);
        return { error: 'Rate limited. Please try again later.' };
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        reply.code(404);
        return { error: error.message };
      }
      
      reply.code(500);
      return { error: error instanceof Error ? error.message : 'Internal server error' };
    }
  });

  // Update checkout branding (auto-selects TEST profile by default)
  fastify.post<{
    Body: any;
  }>('/branding', async (request, reply) => {
    try {
      const body = request.body || {};
      
      // No profileId required - will auto-select TEST unless useProductionProfile is true
      const input = updateCheckoutBrandingInputSchema.parse(body);
      
      const result = await brandingService.upsertBranding(input);
      return result;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : error }, 'Failed to update branding');
      
      if (error instanceof z.ZodError) {
        reply.code(400);
        return { 
          error: 'Validation error',
          details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        };
      }
      
      if (error instanceof Error && error.message.includes('429')) {
        reply.code(429);
        return { error: 'Rate limited. Please try again later.' };
      }
      
      if (error instanceof Error && error.message.includes('not found')) {
        reply.code(404);
        return { error: error.message };
      }
      
      reply.code(500);
      return { error: error instanceof Error ? error.message : 'Internal server error' };
    }
  });

  // Update checkout branding (backward compatibility - with explicit profileId)
  fastify.post<{
    Params: { id: string };
    Body: any;
  }>('/profiles/:id/branding', async (request, reply) => {
    try {
      // Validate input
      const profileId = profileIdSchema.parse(request.params.id);
      const body = request.body || {};
      
      const input = updateCheckoutBrandingInputSchema.parse({
        profileId, // Explicitly provided profileId overrides auto-selection
        ...body,
      });
      
      const result = await brandingService.upsertBranding(input);
      return result;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : error }, 'Failed to update branding');
      
      if (error instanceof z.ZodError) {
        reply.code(400);
        return { 
          error: 'Validation error',
          details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        };
      }
      
      if (error instanceof Error && error.message.includes('429')) {
        reply.code(429);
        return { error: 'Rate limited. Please try again later.' };
      }
      
      reply.code(500);
      return { error: error instanceof Error ? error.message : 'Internal server error' };
    }
  });

  // Upload logo from URL
  fastify.post<{
    Body: any;
  }>('/files', async (request, reply) => {
    try {
      const input = uploadLogoFromUrlInputSchema.parse(request.body);
      const result = await brandingService.uploadLogoFromUrl(input);
      return result;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : error }, 'Failed to upload logo');
      
      if (error instanceof z.ZodError) {
        reply.code(400);
        return { 
          error: 'Validation error',
          details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
        };
      }
      
      if (error instanceof Error && error.message.includes('429')) {
        reply.code(429);
        return { error: 'Rate limited. Please try again later.' };
      }
      
      reply.code(500);
      return { error: error instanceof Error ? error.message : 'Internal server error' };
    }
  });

  return fastify;
}

export async function startHttpServer(port: number = 8787): Promise<void> {
  const server = await createHttpServer();
  
  try {
    await server.listen({ port, host: '0.0.0.0' });
    logger.info({ port }, `HTTP server listening on http://localhost:${port}`);
    logger.info('Available endpoints:');
    logger.info('  GET  /health');
    logger.info('  GET  /profiles');
    logger.info('  GET  /profiles/:id/branding');
    logger.info('  POST /profiles/:id/branding');
    logger.info('  POST /files');
  } catch (err) {
    logger.error({ error: err }, 'Failed to start HTTP server');
    throw err;
  }
}

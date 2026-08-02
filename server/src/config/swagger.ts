/**
 * PURPOSE: Generates OpenAPI/Swagger docs from JSDoc `@openapi` comments
 * scattered across route files, served at /api-docs.
 *
 * WHY GENERATE FROM COMMENTS INSTEAD OF A HAND-WRITTEN swagger.json
 * Keeps documentation physically next to the route it describes, so it's
 * far more likely to be updated when the route changes -- docs that live
 * in a totally separate file tend to silently rot out of date.
 */
import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QueueFlow API',
      version: '1.0.0',
      description: 'Distributed Job Queue System -- REST API',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'qf_access_token' },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});

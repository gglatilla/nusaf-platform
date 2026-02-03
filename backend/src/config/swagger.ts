import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nusaf Platform API',
      version: '1.0.0',
      description: 'B2B platform API for Nusaf Dynamic Technologies - conveyor components, power transmission, and industrial supplies.',
      contact: {
        name: 'Nusaf Support',
        email: 'support@nusaf.co.za',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'NOT_FOUND' },
                message: { type: 'string', example: 'Resource not found' },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 20 },
            totalItems: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxxx...' },
            sku: { type: 'string', example: 'NUS-CHN-001' },
            title: { type: 'string', example: 'Conveyor Chain' },
            description: { type: 'string' },
            price: { type: 'number', example: 1500.00 },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            code: { type: 'string', example: 'CHN' },
            name: { type: 'string', example: 'Conveyor Chain' },
            slug: { type: 'string', example: 'conveyor-chain' },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Products', description: 'Product catalog management' },
      { name: 'Categories', description: 'Category management' },
      { name: 'Quotes', description: 'Quote management' },
      { name: 'Orders', description: 'Sales order management' },
      { name: 'Inventory', description: 'Inventory management' },
      { name: 'Public', description: 'Public API (no authentication required)' },
    ],
  },
  apis: ['./src/api/v1/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

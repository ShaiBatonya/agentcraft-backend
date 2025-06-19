import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AgentCraft API",
      version: "1.0.0",
      description: "API documentation for AgentCraft backend - A modern full-stack chat application with Google OAuth and AI-powered conversations",
      contact: {
        name: "AgentCraft Team",
        email: "support@agentcraft.io",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        CookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "User ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            name: {
              type: "string",
              description: "User display name",
            },
            googleId: {
              type: "string",
              description: "Google OAuth ID",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
            },
          },
        },
        ChatMessage: {
          type: "object",
          properties: {
            role: {
              type: "string",
              enum: ["user", "assistant"],
              description: "Message sender role",
            },
            content: {
              type: "string",
              description: "Message content",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Message timestamp",
            },
          },
          required: ["role", "content"],
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              description: "Operation success status",
            },
            message: {
              type: "string",
              description: "Response message",
            },
            timestamp: {
              type: "string",
              format: "date-time",
              description: "Response timestamp",
            },
          },
          required: ["success", "message"],
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              description: "Error message",
            },
            error: {
              type: "string",
              description: "Error details",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "System",
        description: "System health and debugging endpoints",
      },
      {
        name: "Authentication",
        description: "User authentication and authorization",
      },
      {
        name: "Chat",
        description: "AI chat functionality",
      },
    ],
  },
  apis: [
    "./src/routes/**/*.ts",
    "./src/features/**/*.ts",
    "./src/**/*.routes.ts",
    "./src/**/*.controller.ts",
  ],
}); 
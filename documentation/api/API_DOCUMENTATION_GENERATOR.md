# API Documentation Generator

**Version:** 2.0.0-phase2b  
**Status:** Production Ready  
**Generated:** 2025-07-18  
**Agent:** Documentation Specialist

## Overview

Automated API documentation generation system for SASI Neural Agent System with OpenAPI 3.0 specification, interactive documentation, and automated updates.

## Features

### Core Capabilities
- **OpenAPI 3.0 Specification** - Industry-standard API documentation
- **Interactive Documentation** - Swagger UI integration
- **Automated Generation** - Code-driven documentation updates
- **Multi-format Output** - HTML, PDF, Markdown, JSON
- **API Testing Integration** - Built-in testing capabilities
- **Version Management** - API versioning and changelog

### Documentation Types
- **REST API Endpoints** - Complete endpoint documentation
- **WebSocket Events** - Real-time event specifications
- **Authentication** - Security and authorization docs
- **Error Handling** - Comprehensive error documentation
- **SDK Examples** - Multi-language code examples

## Implementation

### 1. OpenAPI Specification Generator

```typescript
// src/docs/OpenAPIGenerator.ts
import { OpenAPIV3 } from 'openapi-types';
import { writeFileSync } from 'fs';
import { join } from 'path';

export class OpenAPIGenerator {
  private spec: OpenAPIV3.Document;
  
  constructor() {
    this.spec = {
      openapi: '3.0.0',
      info: {
        title: 'SASI Neural Agent System API',
        version: '2.0.0-phase2b',
        description: 'Production-ready neural agent coordination platform',
        contact: {
          name: 'SASI Development Team',
          email: 'api@sasi.example.com',
          url: 'https://sasi.example.com'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'https://api.sasi.example.com/v1',
          description: 'Production server'
        },
        {
          url: 'https://staging-api.sasi.example.com/v1',
          description: 'Staging server'
        },
        {
          url: 'http://localhost:3000/api/v1',
          description: 'Development server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [{ bearerAuth: [] }]
    };
  }
  
  addEndpoint(path: string, method: string, config: any) {
    if (!this.spec.paths[path]) {
      this.spec.paths[path] = {};
    }
    
    this.spec.paths[path][method] = {
      summary: config.summary,
      description: config.description,
      tags: config.tags || ['default'],
      parameters: config.parameters || [],
      requestBody: config.requestBody,
      responses: config.responses || {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        }
      },
      security: config.security || [{ bearerAuth: [] }]
    };
  }
  
  addSchema(name: string, schema: OpenAPIV3.SchemaObject) {
    this.spec.components.schemas[name] = schema;
  }
  
  generateSpec(): OpenAPIV3.Document {
    // Add neural agent endpoints
    this.addAgentEndpoints();
    this.addPerformanceEndpoints();
    this.addWebSocketEndpoints();
    this.addAuthEndpoints();
    
    return this.spec;
  }
  
  private addAgentEndpoints() {
    // GET /agents
    this.addEndpoint('/agents', 'get', {
      summary: 'List all neural agents',
      description: 'Retrieve a list of all active neural agents with their current status',
      tags: ['Neural Agents'],
      parameters: [
        {
          name: 'status',
          in: 'query',
          description: 'Filter by agent status',
          schema: {
            type: 'string',
            enum: ['active', 'inactive', 'training', 'error']
          }
        },
        {
          name: 'type',
          in: 'query',
          description: 'Filter by agent type',
          schema: {
            type: 'string',
            enum: ['researcher', 'coder', 'analyst', 'optimizer', 'coordinator']
          }
        }
      ],
      responses: {
        '200': {
          description: 'List of neural agents',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  agents: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/NeuralAgent' }
                  },
                  total: { type: 'integer' },
                  page: { type: 'integer' },
                  pageSize: { type: 'integer' }
                }
              }
            }
          }
        }
      }
    });
    
    // POST /agents
    this.addEndpoint('/agents', 'post', {
      summary: 'Create a new neural agent',
      description: 'Create and initialize a new neural agent with specified configuration',
      tags: ['Neural Agents'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateAgentRequest' }
          }
        }
      },
      responses: {
        '201': {
          description: 'Agent created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NeuralAgent' }
            }
          }
        },
        '400': {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    });
    
    // GET /agents/{id}
    this.addEndpoint('/agents/{id}', 'get', {
      summary: 'Get neural agent by ID',
      description: 'Retrieve detailed information about a specific neural agent',
      tags: ['Neural Agents'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Agent ID',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Agent details',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NeuralAgent' }
            }
          }
        },
        '404': {
          description: 'Agent not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    });
    
    // POST /agents/{id}/inference
    this.addEndpoint('/agents/{id}/inference', 'post', {
      summary: 'Perform neural inference',
      description: 'Execute neural inference on the specified agent with input data',
      tags: ['Neural Agents'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Agent ID',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/InferenceRequest' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Inference completed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InferenceResponse' }
            }
          }
        }
      }
    });
  }
  
  private addPerformanceEndpoints() {
    // GET /metrics
    this.addEndpoint('/metrics', 'get', {
      summary: 'Get system metrics',
      description: 'Retrieve comprehensive system performance metrics',
      tags: ['Performance'],
      responses: {
        '200': {
          description: 'System metrics',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SystemMetrics' }
            }
          }
        }
      }
    });
    
    // GET /health
    this.addEndpoint('/health', 'get', {
      summary: 'Health check',
      description: 'Check system health and availability',
      tags: ['System'],
      security: [],
      responses: {
        '200': {
          description: 'System is healthy',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HealthStatus' }
            }
          }
        },
        '503': {
          description: 'System is unhealthy',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HealthStatus' }
            }
          }
        }
      }
    });
  }
  
  private addWebSocketEndpoints() {
    // WebSocket documentation
    this.spec.paths['/ws'] = {
      get: {
        summary: 'WebSocket connection',
        description: 'Real-time WebSocket connection for agent updates and performance metrics',
        tags: ['WebSocket'],
        parameters: [
          {
            name: 'Connection',
            in: 'header',
            required: true,
            schema: { type: 'string', enum: ['Upgrade'] }
          },
          {
            name: 'Upgrade',
            in: 'header',
            required: true,
            schema: { type: 'string', enum: ['websocket'] }
          }
        ],
        responses: {
          '101': {
            description: 'Switching Protocols',
            content: {
              'text/plain': {
                schema: { type: 'string' }
              }
            }
          }
        }
      }
    };
  }
  
  private addAuthEndpoints() {
    // POST /auth/login
    this.addEndpoint('/auth/login', 'post', {
      summary: 'User authentication',
      description: 'Authenticate user and receive JWT token',
      tags: ['Authentication'],
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Authentication successful',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginResponse' }
            }
          }
        },
        '401': {
          description: 'Authentication failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    });
  }
  
  saveToFile(filepath: string) {
    const spec = this.generateSpec();
    writeFileSync(filepath, JSON.stringify(spec, null, 2));
  }
}
```

### 2. Schema Definitions

```typescript
// Add schemas to the generator
const generator = new OpenAPIGenerator();

// Neural Agent Schema
generator.addSchema('NeuralAgent', {
  type: 'object',
  required: ['id', 'name', 'type', 'status', 'createdAt'],
  properties: {
    id: {
      type: 'string',
      description: 'Unique agent identifier',
      example: 'agent-123e4567-e89b-12d3-a456-426614174000'
    },
    name: {
      type: 'string',
      description: 'Human-readable agent name',
      example: 'Research Assistant'
    },
    type: {
      type: 'string',
      enum: ['researcher', 'coder', 'analyst', 'optimizer', 'coordinator'],
      description: 'Agent type and specialization'
    },
    status: {
      type: 'string',
      enum: ['active', 'inactive', 'training', 'error'],
      description: 'Current agent status'
    },
    neuralConfig: {
      type: 'object',
      properties: {
        architecture: {
          type: 'string',
          enum: ['MLP', 'CNN', 'RNN', 'LSTM'],
          description: 'Neural network architecture'
        },
        layers: {
          type: 'array',
          items: { type: 'integer' },
          description: 'Layer configuration array'
        },
        learningRate: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Learning rate for training'
        }
      }
    },
    performance: {
      type: 'object',
      properties: {
        inferenceTime: {
          type: 'number',
          description: 'Average inference time in milliseconds'
        },
        memoryUsage: {
          type: 'number',
          description: 'Memory usage in MB'
        },
        accuracy: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Model accuracy score'
        }
      }
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Agent creation timestamp'
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Last update timestamp'
    }
  }
});

// Create Agent Request Schema
generator.addSchema('CreateAgentRequest', {
  type: 'object',
  required: ['name', 'type'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Agent name'
    },
    type: {
      type: 'string',
      enum: ['researcher', 'coder', 'analyst', 'optimizer', 'coordinator'],
      description: 'Agent type'
    },
    neuralConfig: {
      type: 'object',
      properties: {
        architecture: {
          type: 'string',
          enum: ['MLP', 'CNN', 'RNN', 'LSTM'],
          default: 'MLP'
        },
        layers: {
          type: 'array',
          items: { type: 'integer', minimum: 1 },
          default: [128, 64, 32, 16]
        },
        learningRate: {
          type: 'number',
          minimum: 0.0001,
          maximum: 1,
          default: 0.001
        }
      }
    },
    description: {
      type: 'string',
      maxLength: 500,
      description: 'Agent description'
    }
  }
});

// System Metrics Schema
generator.addSchema('SystemMetrics', {
  type: 'object',
  properties: {
    systemHealth: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      description: 'Overall system health score'
    },
    totalAgents: {
      type: 'integer',
      description: 'Total number of agents'
    },
    activeAgents: {
      type: 'integer',
      description: 'Number of active agents'
    },
    averageInferenceTime: {
      type: 'number',
      description: 'Average inference time in milliseconds'
    },
    totalMemoryUsage: {
      type: 'number',
      description: 'Total memory usage in MB'
    },
    cpuUsage: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      description: 'CPU usage percentage'
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: 'Metrics timestamp'
    }
  }
});

// Error Schema
generator.addSchema('Error', {
  type: 'object',
  required: ['error', 'message'],
  properties: {
    error: {
      type: 'string',
      description: 'Error code'
    },
    message: {
      type: 'string',
      description: 'Human-readable error message'
    },
    details: {
      type: 'object',
      description: 'Additional error details'
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: 'Error timestamp'
    }
  }
});
```

### 3. Interactive Documentation Generator

```typescript
// src/docs/SwaggerGenerator.ts
import { writeFileSync } from 'fs';
import { OpenAPIGenerator } from './OpenAPIGenerator';

export class SwaggerGenerator {
  private openApiGenerator: OpenAPIGenerator;
  
  constructor() {
    this.openApiGenerator = new OpenAPIGenerator();
  }
  
  generateSwaggerHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>SASI Neural Agent System API</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function() {
          console.log('Swagger UI loaded');
        }
      });
    };
  </script>
</body>
</html>
    `;
  }
  
  generateReDocHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>SASI Neural Agent System API Documentation</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <redoc spec-url='/api-docs.json'></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc@2.0.0/bundles/redoc.standalone.js"></script>
</body>
</html>
    `;
  }
  
  saveSwaggerUI(filepath: string) {
    writeFileSync(filepath, this.generateSwaggerHTML());
  }
  
  saveReDocUI(filepath: string) {
    writeFileSync(filepath, this.generateReDocHTML());
  }
}
```

### 4. Documentation Build Script

```bash
#!/bin/bash
# scripts/build-docs.sh

set -e

echo "🔧 Building API Documentation..."

# Create docs directory
mkdir -p docs/api

# Generate OpenAPI specification
echo "📝 Generating OpenAPI specification..."
node -e "
const { OpenAPIGenerator } = require('./src/docs/OpenAPIGenerator');
const generator = new OpenAPIGenerator();
generator.saveToFile('./docs/api/openapi.json');
console.log('OpenAPI spec generated: docs/api/openapi.json');
"

# Generate Swagger UI
echo "🌐 Generating Swagger UI..."
node -e "
const { SwaggerGenerator } = require('./src/docs/SwaggerGenerator');
const generator = new SwaggerGenerator();
generator.saveSwaggerUI('./docs/api/swagger.html');
generator.saveReDocUI('./docs/api/redoc.html');
console.log('Interactive docs generated: docs/api/swagger.html, docs/api/redoc.html');
"

# Generate markdown documentation
echo "📖 Generating markdown documentation..."
npx swagger-markdown -i docs/api/openapi.json -o docs/api/API_REFERENCE.md

# Generate PDF documentation
echo "📄 Generating PDF documentation..."
if command -v pandoc &> /dev/null; then
  pandoc docs/api/API_REFERENCE.md -o docs/api/API_REFERENCE.pdf
  echo "PDF generated: docs/api/API_REFERENCE.pdf"
else
  echo "⚠️  Pandoc not installed, skipping PDF generation"
fi

# Copy static assets
echo "📁 Copying static assets..."
cp -r public/assets docs/api/assets 2>/dev/null || true

# Update version in package.json
echo "🔄 Updating documentation version..."
node -e "
const pkg = require('./package.json');
const fs = require('fs');
const versionInfo = {
  version: pkg.version,
  generatedAt: new Date().toISOString(),
  gitCommit: process.env.GIT_COMMIT || 'unknown'
};
fs.writeFileSync('./docs/api/version.json', JSON.stringify(versionInfo, null, 2));
console.log('Version info updated: docs/api/version.json');
"

echo "✅ API Documentation build completed!"
echo "📖 Swagger UI: docs/api/swagger.html"
echo "📖 ReDoc: docs/api/redoc.html"
echo "📖 Markdown: docs/api/API_REFERENCE.md"
echo "📖 OpenAPI JSON: docs/api/openapi.json"
```

### 5. Automated Documentation Updates

```typescript
// src/middleware/documentationMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { OpenAPIGenerator } from '../docs/OpenAPIGenerator';
import { existsSync, readFileSync } from 'fs';

export class DocumentationMiddleware {
  private static instance: DocumentationMiddleware;
  private openApiSpec: any;
  private lastGenerated: Date;
  
  private constructor() {
    this.generateSpecification();
    this.lastGenerated = new Date();
  }
  
  static getInstance(): DocumentationMiddleware {
    if (!DocumentationMiddleware.instance) {
      DocumentationMiddleware.instance = new DocumentationMiddleware();
    }
    return DocumentationMiddleware.instance;
  }
  
  private generateSpecification() {
    const generator = new OpenAPIGenerator();
    this.openApiSpec = generator.generateSpec();
  }
  
  serveSpec(req: Request, res: Response) {
    // Regenerate if more than 5 minutes old
    if (Date.now() - this.lastGenerated.getTime() > 5 * 60 * 1000) {
      this.generateSpecification();
      this.lastGenerated = new Date();
    }
    
    res.json(this.openApiSpec);
  }
  
  serveSwaggerUI(req: Request, res: Response) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>SASI Neural Agent System API</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.presets.standalone],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
    `;
    res.send(html);
  }
  
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Add API documentation headers
      res.setHeader('X-API-Version', '2.0.0-phase2b');
      res.setHeader('X-API-Documentation', '/api-docs');
      next();
    };
  }
}
```

### 6. Integration with Express Server

```typescript
// src/server.ts - Add documentation routes
import express from 'express';
import { DocumentationMiddleware } from './middleware/documentationMiddleware';

const app = express();
const docMiddleware = DocumentationMiddleware.getInstance();

// Add documentation middleware
app.use(docMiddleware.middleware());

// Documentation routes
app.get('/api-docs.json', docMiddleware.serveSpec.bind(docMiddleware));
app.get('/api-docs', docMiddleware.serveSwaggerUI.bind(docMiddleware));
app.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});

// Health check with API info
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.0.0-phase2b',
    documentation: {
      swagger: '/api-docs',
      openapi: '/api-docs.json',
      redoc: '/redoc'
    },
    timestamp: new Date().toISOString()
  });
});
```

### 7. CI/CD Integration

```yaml
# .github/workflows/docs.yml
name: Documentation Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build documentation
        run: |
          chmod +x scripts/build-docs.sh
          ./scripts/build-docs.sh
      
      - name: Validate OpenAPI spec
        run: |
          npx swagger-validator docs/api/openapi.json
      
      - name: Upload documentation artifacts
        uses: actions/upload-artifact@v3
        with:
          name: api-documentation
          path: docs/api/
      
      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/api
          destination_dir: api
```

## Usage

### Development

```bash
# Install dependencies
npm install swagger-ui-dist swagger-validator

# Generate documentation
npm run build:docs

# Start development server with docs
npm run dev

# Access documentation
open http://localhost:3000/api-docs
```

### Production

```bash
# Build optimized documentation
npm run build:docs:prod

# Serve documentation
npm start

# Documentation available at:
# - /api-docs (Swagger UI)
# - /api-docs.json (OpenAPI JSON)
# - /redoc (ReDoc UI)
```

### Testing

```bash
# Validate OpenAPI specification
npm run docs:validate

# Test documentation endpoints
npm run test:docs

# Generate test coverage for docs
npm run coverage:docs
```

## Features

### Real-time Updates
- Automatic specification regeneration
- Live documentation updates
- Version tracking and changelog

### Interactive Testing
- Built-in API testing interface
- Authentication integration
- Request/response examples

### Multi-format Support
- OpenAPI 3.0 JSON/YAML
- Swagger UI interactive docs
- ReDoc documentation
- Markdown and PDF export

### Production Ready
- Optimized for performance
- CDN integration
- Caching strategies
- Error handling

---

**Generated by:** Documentation Specialist Agent  
**Status:** Production Ready  
**Last Updated:** 2025-07-18
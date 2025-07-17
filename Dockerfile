# Multi-stage Dockerfile for SASI/Synaptic-mesh testing
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY sasi/package*.json ./sasi/
COPY synaptic-mesh/package*.json ./synaptic-mesh/

# Install dependencies
RUN npm ci --only=production

# Development stage
FROM base AS development

# Install all dependencies including dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Install claude-flow globally
RUN npm install -g claude-flow@2.0.0-alpha.43

# Create test user
RUN addgroup -g 1001 -S testuser && \
    adduser -S testuser -u 1001 -G testuser

# Set up permissions
RUN chown -R testuser:testuser /app
USER testuser

# Expose ports
EXPOSE 3000 3001 8080

# Default command
CMD ["npm", "run", "dev"]

# Testing stage
FROM development AS testing

# Switch back to root for system setup
USER root

# Install additional test dependencies
RUN apk add --no-cache \
    xvfb \
    xvfb-run \
    dbus \
    fontconfig

# Create virtual display for headless testing
ENV DISPLAY=:99

# Set up test environment
RUN mkdir -p /tmp/.X11-unix && \
    chmod 1777 /tmp/.X11-unix

# Switch back to test user
USER testuser

# Set test environment variables
ENV NODE_ENV=test \
    CLAUDE_FLOW_TEST_MODE=true \
    SASI_TEST_MODE=true \
    SYNAPTIC_MESH_TEST_MODE=true \
    CI=true

# Create test directories
RUN mkdir -p /app/coverage && \
    mkdir -p /app/reports && \
    mkdir -p /app/tests/screenshots && \
    mkdir -p /app/tests/videos

# Run tests
CMD ["npm", "run", "test:ci"]

# Production build stage
FROM base AS production

# Copy built application
COPY --from=development /app/dist ./dist
COPY --from=development /app/sasi/dist ./sasi/dist
COPY --from=development /app/synaptic-mesh/dist ./synaptic-mesh/dist

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001 -G appuser

# Set permissions
RUN chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]

# Benchmark stage
FROM testing AS benchmark

# Install additional performance tools
USER root
RUN apk add --no-cache \
    htop \
    iotop \
    perf \
    stress-ng

USER testuser

# Set benchmark environment
ENV BENCHMARK_MODE=true \
    PERFORMANCE_TESTING=true \
    WASM_OPTIMIZATION=true

# Run benchmarks
CMD ["npm", "run", "benchmark"]

# Security testing stage
FROM testing AS security

# Install security tools
USER root
RUN apk add --no-cache \
    nmap \
    openssl \
    curl

USER testuser

# Set security test environment
ENV SECURITY_TESTING=true \
    VULNERABILITY_SCANNING=true

# Run security tests
CMD ["npm", "run", "test:security"]

# Load testing stage
FROM testing AS load

# Install load testing tools
USER root
RUN npm install -g artillery \
    k6 \
    loadtest

USER testuser

# Set load test environment
ENV LOAD_TESTING=true \
    STRESS_TESTING=true \
    CONCURRENT_USERS=100

# Run load tests
CMD ["npm", "run", "test:load"]

# Final multi-purpose stage
FROM testing AS final

# Copy configurations
COPY docker-compose.test.yml ./
COPY .github/workflows/ci.yml ./.github/workflows/

# Set final environment
ENV ENVIRONMENT=docker \
    CONTAINER_MODE=true \
    MULTI_STAGE_TESTING=true

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Function to run tests based on TEST_TYPE\n\
run_tests() {\n\
    case "$TEST_TYPE" in\n\
        "unit")\n\
            echo "Running unit tests..."\n\
            npm run test:unit\n\
            ;;\n\
        "integration")\n\
            echo "Running integration tests..."\n\
            npm run test:integration\n\
            ;;\n\
        "e2e")\n\
            echo "Running E2E tests..."\n\
            Xvfb :99 -screen 0 1920x1080x24 &\n\
            npm run test:e2e\n\
            ;;\n\
        "performance")\n\
            echo "Running performance tests..."\n\
            npm run test:performance\n\
            ;;\n\
        "wasm")\n\
            echo "Running WASM tests..."\n\
            npm run test:wasm\n\
            ;;\n\
        "load")\n\
            echo "Running load tests..."\n\
            npm run test:load\n\
            ;;\n\
        "security")\n\
            echo "Running security tests..."\n\
            npm run test:security\n\
            ;;\n\
        "all")\n\
            echo "Running all tests..."\n\
            npm run test:all\n\
            ;;\n\
        *)\n\
            echo "Running default CI tests..."\n\
            npm run test:ci\n\
            ;;\n\
    esac\n\
}\n\
\n\
# Initialize claude-flow\n\
npx claude-flow@alpha hooks pre-task --description "Docker test execution"\n\
\n\
# Run tests\n\
run_tests\n\
\n\
# Cleanup\n\
npx claude-flow@alpha hooks post-task --task-id "docker-tests"\n\
\n\
echo "Tests completed successfully!"' > /app/docker-entrypoint.sh

# Make entrypoint executable
USER root
RUN chmod +x /app/docker-entrypoint.sh
USER testuser

# Set entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command
CMD ["npm", "run", "test:ci"]
# CI/CD Automation Pipeline

**Version:** 2.0.0-phase2b  
**Status:** Production Ready  
**Generated:** 2025-07-18  
**Agent:** Documentation Specialist

## Overview

Comprehensive CI/CD pipeline for SASI Neural Agent System with automated testing, deployment, monitoring, and rollback capabilities.

## Pipeline Architecture

### Core Components
- **GitHub Actions** - Primary CI/CD orchestration
- **Docker** - Containerization and deployment
- **Kubernetes** - Container orchestration
- **ArgoCD** - GitOps deployment
- **Prometheus/Grafana** - Monitoring and alerting
- **SonarQube** - Code quality analysis

### Pipeline Stages
1. **Source Control** - Git hooks and validation
2. **Build** - Code compilation and optimization
3. **Test** - Comprehensive test suite execution
4. **Quality** - Code quality and security scanning
5. **Package** - Container image building
6. **Deploy** - Automated deployment to environments
7. **Monitor** - Real-time monitoring and alerting
8. **Rollback** - Automated rollback on failure

## Implementation

### 1. GitHub Actions Workflows

#### Main CI/CD Pipeline
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop, 'feature/*']
  pull_request:
    branches: [main, develop]
  release:
    types: [published]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Job 1: Code Quality and Security
  quality:
    name: Code Quality & Security
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: |
          npm run lint -- --format json --output-file eslint-results.json
          npm run lint
      
      - name: Run Prettier check
        run: npm run format:check
      
      - name: Run TypeScript check
        run: npm run typecheck
      
      - name: Security audit
        run: npm audit --audit-level=high
      
      - name: SAST with CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript
      
      - name: CodeQL analysis
        uses: github/codeql-action/analyze@v2
      
      - name: SonarQube scan
        uses: sonarqube-quality-gate-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      
      - name: Upload quality artifacts
        uses: actions/upload-artifact@v4
        with:
          name: quality-reports
          path: |
            eslint-results.json
            coverage/
            sonar-report.json

  # Job 2: Unit and Integration Tests
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: quality
    strategy:
      matrix:
        test-suite: [unit, integration, performance, security]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run test suite
        run: |
          case "${{ matrix.test-suite }}" in
            "unit")
              npm run test:unit -- --coverage
              ;;
            "integration")
              npm run test:integration -- --coverage
              ;;
            "performance")
              npm run test:performance -- --coverage
              ;;
            "security")
              npm run test:security -- --coverage
              ;;
          esac
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.test-suite }}
          path: |
            coverage/
            test-results.xml
            junit.xml
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: ${{ matrix.test-suite }}

  # Job 3: E2E Tests
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: test
    services:
      chrome:
        image: selenium/standalone-chrome:latest
        ports:
          - 4444:4444
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: |
          npm start &
          sleep 10
          curl -f http://localhost:3000/health
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          SELENIUM_REMOTE_URL: http://localhost:4444/wd/hub
      
      - name: Upload E2E artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: e2e-results
          path: |
            tests/screenshots/
            tests/videos/
            e2e-report.html

  # Job 4: Build and Package
  build:
    name: Build & Package
    runs-on: ubuntu-latest
    needs: [quality, test]
    outputs:
      image: ${{ steps.image.outputs.image }}
      digest: ${{ steps.build.outputs.digest }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Build documentation
        run: |
          chmod +x scripts/build-docs.sh
          ./scripts/build-docs.sh
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.production
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Set image output
        id: image
        run: echo "image=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}" >> $GITHUB_OUTPUT
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            dist/
            docs/api/
            Dockerfile.production

  # Job 5: Security Scanning
  security:
    name: Security Scanning
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ needs.build.outputs.image }}
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Container security scan
        uses: anchore/scan-action@v3
        with:
          image: ${{ needs.build.outputs.image }}
          fail-build: true
          severity-cutoff: high

  # Job 6: Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build, security, e2e]
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.sasi.example.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'latest'
      
      - name: Configure kubectl
        run: |
          mkdir -p $HOME/.kube
          echo "${{ secrets.KUBE_CONFIG_STAGING }}" | base64 -d > $HOME/.kube/config
      
      - name: Deploy to staging
        run: |
          sed -i 's|IMAGE_TAG|${{ github.sha }}|g' k8s/staging/deployment.yaml
          kubectl apply -f k8s/staging/
          kubectl rollout status deployment/sasi-app -n sasi-staging
      
      - name: Run smoke tests
        run: |
          sleep 30
          npm run test:smoke -- --baseUrl=https://staging.sasi.example.com
      
      - name: Update ArgoCD application
        run: |
          curl -X POST "${{ secrets.ARGOCD_SERVER }}/api/v1/applications/sasi-staging/sync" \
            -H "Authorization: Bearer ${{ secrets.ARGOCD_TOKEN }}" \
            -H "Content-Type: application/json"

  # Job 7: Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://sasi.example.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'latest'
      
      - name: Configure kubectl
        run: |
          mkdir -p $HOME/.kube
          echo "${{ secrets.KUBE_CONFIG_PRODUCTION }}" | base64 -d > $HOME/.kube/config
      
      - name: Blue-Green deployment
        run: |
          # Deploy to green environment
          sed -i 's|IMAGE_TAG|${{ github.sha }}|g' k8s/production/deployment-green.yaml
          kubectl apply -f k8s/production/deployment-green.yaml
          kubectl rollout status deployment/sasi-app-green -n sasi-production
          
          # Health check
          kubectl exec -n sasi-production deployment/sasi-app-green -- curl -f http://localhost:3000/health
          
          # Switch traffic
          kubectl patch service sasi-app-service -n sasi-production -p '{"spec":{"selector":{"app":"sasi-app","version":"green"}}}'
          
          # Cleanup old blue deployment
          kubectl delete deployment sasi-app-blue -n sasi-production --ignore-not-found
          kubectl patch deployment sasi-app-green -n sasi-production --type json -p='[{"op": "replace", "path": "/metadata/labels/version", "value": "blue"}]'
      
      - name: Production health check
        run: |
          sleep 30
          curl -f https://sasi.example.com/health
          npm run test:smoke -- --baseUrl=https://sasi.example.com
      
      - name: Update production monitoring
        run: |
          curl -X POST "${{ secrets.GRAFANA_URL }}/api/annotations" \
            -H "Authorization: Bearer ${{ secrets.GRAFANA_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "tags": ["deployment", "production"],
              "text": "Production deployment: ${{ github.sha }}",
              "time": '$(date +%s000)'
            }'

  # Job 8: Performance Testing
  performance:
    name: Performance Testing
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run performance tests
        run: |
          k6 run --out json=performance-results.json tests/performance/load-test.js
      
      - name: Analyze performance results
        run: |
          node scripts/analyze-performance.js performance-results.json
      
      - name: Upload performance artifacts
        uses: actions/upload-artifact@v4
        with:
          name: performance-results
          path: |
            performance-results.json
            performance-report.html

  # Job 9: Monitoring and Alerting
  monitoring:
    name: Setup Monitoring
    runs-on: ubuntu-latest
    needs: deploy-production
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Update Prometheus configuration
        run: |
          kubectl create configmap prometheus-config \
            --from-file=monitoring/prometheus.yml \
            --namespace=monitoring \
            --dry-run=client -o yaml | kubectl apply -f -
          
          kubectl rollout restart deployment/prometheus -n monitoring
      
      - name: Update Grafana dashboards
        run: |
          for dashboard in monitoring/dashboards/*.json; do
            curl -X POST "${{ secrets.GRAFANA_URL }}/api/dashboards/db" \
              -H "Authorization: Bearer ${{ secrets.GRAFANA_TOKEN }}" \
              -H "Content-Type: application/json" \
              -d @"$dashboard"
          done
      
      - name: Setup alerting rules
        run: |
          kubectl create configmap alerting-rules \
            --from-file=monitoring/alerts/ \
            --namespace=monitoring \
            --dry-run=client -o yaml | kubectl apply -f -
          
          kubectl rollout restart deployment/alertmanager -n monitoring

  # Job 10: Rollback (triggered manually or on failure)
  rollback:
    name: Rollback Deployment
    runs-on: ubuntu-latest
    if: failure() || github.event_name == 'workflow_dispatch'
    needs: deploy-production
    environment:
      name: production
      url: https://sasi.example.com
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'latest'
      
      - name: Configure kubectl
        run: |
          mkdir -p $HOME/.kube
          echo "${{ secrets.KUBE_CONFIG_PRODUCTION }}" | base64 -d > $HOME/.kube/config
      
      - name: Rollback deployment
        run: |
          kubectl rollout undo deployment/sasi-app -n sasi-production
          kubectl rollout status deployment/sasi-app -n sasi-production
      
      - name: Verify rollback
        run: |
          sleep 30
          curl -f https://sasi.example.com/health
      
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              "text": "🚨 Production rollback completed for SASI Neural Agent System",
              "attachments": [{
                "color": "warning",
                "fields": [{
                  "title": "Commit",
                  "value": "${{ github.sha }}",
                  "short": true
                }, {
                  "title": "Branch",
                  "value": "${{ github.ref }}",
                  "short": true
                }]
              }]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

#### Feature Branch Workflow
```yaml
# .github/workflows/feature-branch.yml
name: Feature Branch CI

on:
  push:
    branches: ['feature/*']
  pull_request:
    branches: [develop]

jobs:
  quick-validation:
    name: Quick Validation
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run quick checks
        run: |
          npm run lint
          npm run typecheck
          npm run test:unit
          npm run build
      
      - name: Comment PR
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Quick validation passed! Ready for full CI/CD pipeline.'
            })
```

### 2. Kubernetes Deployment Manifests

#### Production Deployment
```yaml
# k8s/production/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sasi-app
  namespace: sasi-production
  labels:
    app: sasi-app
    version: blue
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: sasi-app
  template:
    metadata:
      labels:
        app: sasi-app
        version: blue
    spec:
      containers:
      - name: sasi-app
        image: ghcr.io/sasi/neural-agent-system:IMAGE_TAG
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_PATH
          value: "/app/data/neural.db"
        - name: NEURAL_MAX_AGENTS
          value: "50"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: sasi-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: data-storage
          mountPath: /app/data
        - name: logs-storage
          mountPath: /app/logs
      volumes:
      - name: data-storage
        persistentVolumeClaim:
          claimName: sasi-data-pvc
      - name: logs-storage
        persistentVolumeClaim:
          claimName: sasi-logs-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: sasi-app-service
  namespace: sasi-production
spec:
  selector:
    app: sasi-app
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sasi-ingress
  namespace: sasi-production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "1000"
spec:
  tls:
  - hosts:
    - sasi.example.com
    secretName: sasi-tls
  rules:
  - host: sasi.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sasi-app-service
            port:
              number: 80
```

### 3. Monitoring and Alerting

#### Prometheus Configuration
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts/*.yml"

scrape_configs:
  - job_name: 'sasi-app'
    static_configs:
      - targets: ['sasi-app-service:80']
    metrics_path: '/api/metrics'
    scrape_interval: 5s
    scrape_timeout: 3s

  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - sasi-production
            - sasi-staging
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

#### Alerting Rules
```yaml
# monitoring/alerts/sasi-alerts.yml
groups:
  - name: sasi-system
    rules:
      - alert: SASIHighErrorRate
        expr: rate(sasi_http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "SASI Neural Agent System high error rate"
          description: "Error rate is {{ $value }} errors per second"
      
      - alert: SASIHighLatency
        expr: histogram_quantile(0.95, rate(sasi_http_request_duration_seconds_bucket[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "SASI Neural Agent System high latency"
          description: "95th percentile latency is {{ $value }} seconds"
      
      - alert: SASINeuralAgentDown
        expr: sasi_neural_agents_active < 1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "No active neural agents"
          description: "SASI system has no active neural agents"
      
      - alert: SASIHighMemoryUsage
        expr: sasi_memory_usage_bytes / sasi_memory_limit_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "SASI Neural Agent System high memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"
      
      - alert: SASISystemUnhealthy
        expr: sasi_system_health_score < 80
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "SASI Neural Agent System unhealthy"
          description: "System health score is {{ $value }}"
```

#### Grafana Dashboard
```json
{
  "dashboard": {
    "id": null,
    "title": "SASI Neural Agent System - Production Dashboard",
    "tags": ["sasi", "neural-agents", "production"],
    "timezone": "UTC",
    "panels": [
      {
        "id": 1,
        "title": "System Health Score",
        "type": "stat",
        "targets": [
          {
            "expr": "sasi_system_health_score",
            "legendFormat": "Health Score"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                {"color": "red", "value": 0},
                {"color": "yellow", "value": 80},
                {"color": "green", "value": 95}
              ]
            },
            "unit": "percent"
          }
        }
      },
      {
        "id": 2,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(sasi_http_requests_total[5m])",
            "legendFormat": "{{ method }} {{ endpoint }}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec",
            "min": 0
          }
        ]
      },
      {
        "id": 3,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(sasi_http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          },
          {
            "expr": "histogram_quantile(0.95, rate(sasi_http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.99, rate(sasi_http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "99th percentile"
          }
        ],
        "yAxes": [
          {
            "label": "Seconds",
            "min": 0
          }
        ]
      },
      {
        "id": 4,
        "title": "Neural Agent Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "sasi_neural_agent_inference_time_seconds",
            "legendFormat": "Inference Time - {{ agent_id }}"
          },
          {
            "expr": "sasi_neural_agent_memory_usage_bytes",
            "legendFormat": "Memory Usage - {{ agent_id }}"
          }
        ]
      },
      {
        "id": 5,
        "title": "Active Neural Agents",
        "type": "stat",
        "targets": [
          {
            "expr": "sasi_neural_agents_active",
            "legendFormat": "Active Agents"
          }
        ]
      },
      {
        "id": 6,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(sasi_http_requests_total{status=~\"4..\"}[5m])",
            "legendFormat": "4xx errors"
          },
          {
            "expr": "rate(sasi_http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

### 4. Deployment Scripts

#### Automated Deployment Script
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}
NAMESPACE="sasi-${ENVIRONMENT}"

echo "🚀 Deploying SASI Neural Agent System to ${ENVIRONMENT}"
echo "📦 Image: ghcr.io/sasi/neural-agent-system:${IMAGE_TAG}"
echo "🎯 Namespace: ${NAMESPACE}"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "✅ Valid environments: staging, production"
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo "📦 Creating namespace: $NAMESPACE"
    kubectl create namespace "$NAMESPACE"
fi

# Update image tag in deployment manifests
echo "📝 Updating deployment manifests..."
find "k8s/${ENVIRONMENT}" -name "*.yaml" -exec sed -i "s|IMAGE_TAG|${IMAGE_TAG}|g" {} +

# Apply configuration
echo "⚙️  Applying configuration..."
kubectl apply -f "k8s/${ENVIRONMENT}/"

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
kubectl rollout status deployment/sasi-app -n "$NAMESPACE" --timeout=600s

# Health check
echo "🏥 Performing health check..."
sleep 30

if [[ "$ENVIRONMENT" == "production" ]]; then
    HEALTH_URL="https://sasi.example.com/health"
else
    HEALTH_URL="https://staging.sasi.example.com/health"
fi

if curl -f "$HEALTH_URL" &> /dev/null; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    echo "🔄 Rolling back deployment..."
    kubectl rollout undo deployment/sasi-app -n "$NAMESPACE"
    exit 1
fi

# Performance validation
echo "🔍 Running performance validation..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    npm run test:smoke -- --baseUrl="$HEALTH_URL"
fi

echo "🎉 Deployment completed successfully!"
echo "🔗 Application URL: $HEALTH_URL"
echo "📊 Monitoring: https://grafana.example.com/d/sasi-${ENVIRONMENT}"
```

#### Rollback Script
```bash
#!/bin/bash
# scripts/rollback.sh

set -e

ENVIRONMENT=${1:-staging}
REVISION=${2:-1}
NAMESPACE="sasi-${ENVIRONMENT}"

echo "🔄 Rolling back SASI Neural Agent System in ${ENVIRONMENT}"
echo "📦 Rolling back ${REVISION} revision(s)"
echo "🎯 Namespace: ${NAMESPACE}"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment: $ENVIRONMENT"
    exit 1
fi

# Show current deployment status
echo "📊 Current deployment status:"
kubectl get deployment sasi-app -n "$NAMESPACE"

# Show rollout history
echo "📜 Rollout history:"
kubectl rollout history deployment/sasi-app -n "$NAMESPACE"

# Confirm rollback
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "⚠️  WARNING: This will rollback the production environment!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Rollback cancelled"
        exit 1
    fi
fi

# Perform rollback
echo "🔄 Performing rollback..."
if [[ "$REVISION" == "1" ]]; then
    kubectl rollout undo deployment/sasi-app -n "$NAMESPACE"
else
    kubectl rollout undo deployment/sasi-app -n "$NAMESPACE" --to-revision="$REVISION"
fi

# Wait for rollback to complete
echo "⏳ Waiting for rollback to complete..."
kubectl rollout status deployment/sasi-app -n "$NAMESPACE" --timeout=300s

# Health check
echo "🏥 Performing health check..."
sleep 30

if [[ "$ENVIRONMENT" == "production" ]]; then
    HEALTH_URL="https://sasi.example.com/health"
else
    HEALTH_URL="https://staging.sasi.example.com/health"
fi

if curl -f "$HEALTH_URL" &> /dev/null; then
    echo "✅ Rollback completed successfully!"
    echo "🔗 Application URL: $HEALTH_URL"
else
    echo "❌ Rollback failed - application is not healthy!"
    exit 1
fi

# Send notification
echo "📢 Sending rollback notification..."
if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H "Content-type: application/json" \
        --data '{
            "text": "🔄 SASI Neural Agent System rollback completed",
            "attachments": [{
                "color": "warning",
                "fields": [{
                    "title": "Environment",
                    "value": "'$ENVIRONMENT'",
                    "short": true
                }, {
                    "title": "Revision",
                    "value": "'$REVISION'",
                    "short": true
                }]
            }]
        }'
fi

echo "🎉 Rollback process completed!"
```

### 5. Performance Testing

#### Load Testing Script
```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const httpReqs = new Counter('http_reqs');
const httpReqFailed = new Rate('http_req_failed');
const httpReqDuration = new Trend('http_req_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],           // 95% of requests under 100ms
    http_req_failed: ['rate<0.01'],             // Error rate under 1%
    http_reqs: ['count>1000'],                  // Total requests over 1000
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.sasi.example.com';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

// Test scenarios
export default function() {
  const scenarios = [
    testHealthEndpoint,
    testAgentsList,
    testCreateAgent,
    testNeuralInference,
    testMetrics,
  ];
  
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();
  
  sleep(1);
}

function testHealthEndpoint() {
  const response = http.get(`${BASE_URL}/health`);
  
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 50ms': (r) => r.timings.duration < 50,
    'health check has status field': (r) => JSON.parse(r.body).status === 'healthy',
  });
  
  httpReqs.add(1);
  httpReqFailed.add(response.status !== 200);
  httpReqDuration.add(response.timings.duration);
}

function testAgentsList() {
  const response = http.get(`${BASE_URL}/api/agents`, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  
  check(response, {
    'agents list status is 200': (r) => r.status === 200,
    'agents list response time < 100ms': (r) => r.timings.duration < 100,
    'agents list has data': (r) => JSON.parse(r.body).agents !== undefined,
  });
  
  httpReqs.add(1);
  httpReqFailed.add(response.status !== 200);
  httpReqDuration.add(response.timings.duration);
}

function testCreateAgent() {
  const payload = {
    name: `Test Agent ${Math.floor(Math.random() * 1000)}`,
    type: 'researcher',
    neuralConfig: {
      architecture: 'MLP',
      layers: [64, 32, 16],
      learningRate: 0.001
    }
  };
  
  const response = http.post(`${BASE_URL}/api/agents`, JSON.stringify(payload), {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  
  check(response, {
    'create agent status is 201': (r) => r.status === 201,
    'create agent response time < 200ms': (r) => r.timings.duration < 200,
    'create agent returns ID': (r) => JSON.parse(r.body).id !== undefined,
  });
  
  httpReqs.add(1);
  httpReqFailed.add(response.status !== 201);
  httpReqDuration.add(response.timings.duration);
}

function testNeuralInference() {
  // First get an agent ID
  const agentsResponse = http.get(`${BASE_URL}/api/agents`, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (agentsResponse.status !== 200) return;
  
  const agents = JSON.parse(agentsResponse.body).agents;
  if (agents.length === 0) return;
  
  const agentId = agents[0].id;
  const payload = {
    input: [0.1, 0.2, 0.3, 0.4, 0.5],
    timeout: 100
  };
  
  const response = http.post(`${BASE_URL}/api/agents/${agentId}/inference`, JSON.stringify(payload), {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  
  check(response, {
    'inference status is 200': (r) => r.status === 200,
    'inference response time < 100ms': (r) => r.timings.duration < 100,
    'inference returns result': (r) => JSON.parse(r.body).result !== undefined,
  });
  
  httpReqs.add(1);
  httpReqFailed.add(response.status !== 200);
  httpReqDuration.add(response.timings.duration);
}

function testMetrics() {
  const response = http.get(`${BASE_URL}/api/metrics`, {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  
  check(response, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics response time < 50ms': (r) => r.timings.duration < 50,
    'metrics has system health': (r) => JSON.parse(r.body).systemHealth !== undefined,
  });
  
  httpReqs.add(1);
  httpReqFailed.add(response.status !== 200);
  httpReqDuration.add(response.timings.duration);
}

// Setup and teardown
export function setup() {
  console.log('🚀 Starting performance tests...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  
  // Verify system is healthy before starting
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`System is not healthy: ${healthResponse.status}`);
  }
  
  return { baseUrl: BASE_URL };
}

export function teardown(data) {
  console.log('🏁 Performance tests completed');
  console.log(`📊 Results available in performance-results.json`);
}
```

### 6. Package.json Scripts

```json
{
  "scripts": {
    "ci:lint": "eslint src --ext ts,tsx --format json --output-file eslint-results.json",
    "ci:test": "jest --coverage --ci --testResultsProcessor=jest-junit",
    "ci:test:unit": "jest --testPathPattern=tests/unit --coverage --ci",
    "ci:test:integration": "jest --testPathPattern=tests/integration --coverage --ci",
    "ci:test:e2e": "jest --testPathPattern=tests/e2e --ci --testTimeout=300000",
    "ci:test:performance": "jest --testPathPattern=tests/performance --ci",
    "ci:test:security": "jest --testPathPattern=tests/security --ci",
    "ci:build": "npm run build && npm run build:docs",
    "ci:deploy:staging": "./scripts/deploy.sh staging",
    "ci:deploy:production": "./scripts/deploy.sh production",
    "ci:rollback:staging": "./scripts/rollback.sh staging",
    "ci:rollback:production": "./scripts/rollback.sh production",
    "ci:perf:test": "k6 run --out json=performance-results.json tests/performance/load-test.js",
    "ci:security:scan": "npm audit --audit-level=high && trivy fs .",
    "ci:docs:build": "./scripts/build-docs.sh",
    "ci:docs:deploy": "gh-pages -d docs/api",
    "ci:monitoring:update": "./scripts/update-monitoring.sh",
    "ci:alerts:test": "./scripts/test-alerts.sh",
    "ci:smoke:test": "npm run test:smoke",
    "ci:health:check": "curl -f $HEALTH_URL/health",
    "ci:metrics:collect": "node scripts/collect-metrics.js",
    "ci:report:generate": "node scripts/generate-report.js"
  }
}
```

## Usage

### Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/new-neural-agent
   # Make changes
   git push origin feature/new-neural-agent
   # Create PR - triggers feature branch CI
   ```

2. **Code Review**
   - Automated quality checks run
   - Manual code review required
   - Tests must pass before merge

3. **Merge to Develop**
   - Full CI/CD pipeline runs
   - Automatic deployment to staging
   - Performance tests executed

4. **Production Release**
   - Merge develop to main
   - Blue-green deployment to production
   - Monitoring and alerting updated

### Manual Operations

```bash
# Deploy to staging
./scripts/deploy.sh staging v2.0.0

# Deploy to production
./scripts/deploy.sh production v2.0.0

# Rollback production
./scripts/rollback.sh production 1

# Run performance tests
npm run ci:perf:test

# Check system health
npm run ci:health:check
```

## Features

### Automated Testing
- **Unit Tests** - Fast, isolated component tests
- **Integration Tests** - Service integration validation
- **E2E Tests** - Full user journey testing
- **Performance Tests** - Load and stress testing
- **Security Tests** - Vulnerability scanning

### Quality Assurance
- **Code Quality** - ESLint, Prettier, SonarQube
- **Security Scanning** - CodeQL, Trivy, npm audit
- **Test Coverage** - Comprehensive coverage reporting
- **Performance Monitoring** - Real-time metrics

### Deployment Strategies
- **Blue-Green Deployment** - Zero downtime deployments
- **Rolling Updates** - Gradual rollout capability
- **Canary Releases** - Risk-controlled releases
- **Automatic Rollback** - Fast failure recovery

### Production Monitoring
- **Real-time Metrics** - System and application metrics
- **Alerting** - Proactive issue detection
- **Dashboards** - Visual monitoring interfaces
- **Log Aggregation** - Centralized logging

### Security
- **Container Scanning** - Vulnerability detection
- **Secrets Management** - Secure credential handling
- **Network Policies** - Traffic control
- **RBAC** - Role-based access control

---

**Generated by:** Documentation Specialist Agent  
**Status:** Production Ready  
**Last Updated:** 2025-07-18
# F1 OAuth Service - SASI Neural Architecture

Production-ready OAuth 2.0 / OpenID Connect authentication service for SASI@home neural network platform.

## 🚀 Features

- **OAuth 2.0 / OIDC Compliant** - Full RFC 6749 and OpenID Connect implementation
- **Multi-Provider Support** - Google, GitHub, and custom OIDC providers
- **JWT Security** - HS256 signed tokens with refresh token rotation
- **Production Security** - Helmet.js, CORS, rate limiting, CSRF protection
- **Neural Integration** - Seamless SASI neural network permissions and quotas
- **SQLite Database** - Optimized queries with automatic migrations
- **TypeScript** - Full type safety with strict configuration

## 📦 Installation

```bash
cd oauth
npm install
cp .env.example .env
```

## ⚙️ Configuration

Edit `.env` file with your OAuth provider credentials:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your-session-secret

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database
DATABASE_PATH=./storage/auth.db
DATABASE_BACKUP_PATH=./storage/backups
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm test

# Type checking
npm run typecheck

# Database migration
npm run db:migrate
```

## 📁 Project Structure

```
oauth/
├── src/
│   ├── server/           # Express server setup
│   ├── services/         # OAuth & JWT business logic
│   ├── controllers/      # HTTP request handlers
│   ├── middleware/       # Authentication middleware
│   ├── config/          # Passport.js strategies
│   └── storage/         # Database layer
├── types.ts             # TypeScript definitions
└── config/              # Application configuration
```

## 🔐 OAuth Flow

1. **Authorization Request** - `GET /auth/:provider`
2. **OAuth Callback** - `GET /auth/:provider/callback`
3. **JWT Token Issue** - Access + Refresh tokens returned
4. **Protected Resources** - JWT validation on API endpoints
5. **Token Refresh** - `POST /auth/refresh`

## 🧠 SASI Integration

The OAuth service integrates with SASI neural architecture:

- **Neural Permissions** - Fine-grained access control
- **Compute Quotas** - Resource allocation management
- **Synaptic Connections** - Real-time connection tracking
- **Profile Integration** - User preferences and neural settings

## 📊 API Endpoints

### Authentication
- `GET /auth/:provider` - Initiate OAuth flow
- `GET /auth/:provider/callback` - Handle OAuth callback
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - End user session
- `GET /auth/profile` - Get user profile

### Neural Integration
- `GET /neural/permissions` - Get neural permissions
- `POST /neural/quota` - Update compute quota
- `GET /neural/connections` - List synaptic connections

### System
- `GET /health` - Health check endpoint
- `GET /.well-known/openid-configuration` - OIDC discovery
- `GET /.well-known/jwks.json` - JWT key sets

## 🔒 Security Features

- **CSRF Protection** - Double-submit cookie pattern
- **Rate Limiting** - Per-IP request throttling
- **Secure Headers** - Helmet.js security headers
- **Input Validation** - Express-validator sanitization
- **SQL Injection Protection** - Parameterized queries
- **XSS Prevention** - Content Security Policy

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🚀 Deployment

### Docker

```bash
docker build -t sasi-f1-oauth .
docker run -p 3001:3001 --env-file .env sasi-f1-oauth
```

### Production Environment

1. Set `NODE_ENV=production`
2. Configure proper JWT secrets
3. Set up SSL/TLS termination
4. Configure database backups
5. Set up monitoring and logging

## 📈 Monitoring

- **Health Endpoint** - `/health` with system status
- **Performance Metrics** - Request timing and success rates
- **Error Tracking** - Comprehensive error logging
- **Database Health** - Connection pool monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details
/**
 * F1 OAuth Database Layer
 * SQLite with production-ready schema and migrations
 */

import Database from 'better-sqlite3';
import { config } from '../config/config';
import { User, RefreshToken, AuthSession, OAuthClient, AuthorizationCode } from '../types';

export class OAuthDatabase {
  private db: Database.Database;

  constructor() {
    this.db = new Database(config.database.filename, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
    });
    
    // Enable WAL mode for better performance
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 1000');
    this.db.pragma('temp_store = memory');
    
    this.initSchema();
    this.prepareStatements();
  }

  private initSchema(): void {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        provider TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME,
        metadata TEXT DEFAULT '{}',
        UNIQUE(provider, provider_id)
      );
    `);

    // Refresh tokens table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_revoked INTEGER DEFAULT 0,
        client_id TEXT,
        scope TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Auth sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1,
        user_agent TEXT,
        ip_address TEXT,
        metadata TEXT DEFAULT '{}',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // OAuth clients table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS oauth_clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        secret TEXT NOT NULL,
        redirect_uris TEXT NOT NULL,
        scope TEXT NOT NULL,
        grant_types TEXT NOT NULL,
        response_types TEXT NOT NULL,
        is_public INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active INTEGER DEFAULT 1
      );
    `);

    // Authorization codes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS authorization_codes (
        code TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        scope TEXT NOT NULL,
        redirect_uri TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_used INTEGER DEFAULT 0,
        code_challenge TEXT,
        code_challenge_method TEXT,
        FOREIGN KEY (client_id) REFERENCES oauth_clients(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(access_token);
      CREATE INDEX IF NOT EXISTS idx_authorization_codes_client ON authorization_codes(client_id);
    `);

    // Insert default OAuth client for SASI frontend
    this.db.exec(`
      INSERT OR IGNORE INTO oauth_clients (
        id, name, secret, redirect_uris, scope, grant_types, response_types, is_public
      ) VALUES (
        'sasi-frontend',
        'SASI Frontend Application',
        '${process.env.OAUTH_CLIENT_SECRET || 'dev-secret-change-in-production'}',
        '["http://localhost:3000/auth/callback", "https://your-domain.com/auth/callback"]',
        '["openid", "profile", "email", "sasi:neural", "sasi:compute"]',
        '["authorization_code", "refresh_token"]',
        '["code", "token"]',
        1
      );
    `);
  }

  private prepareStatements(): void {
    // Prepare commonly used statements for better performance
    this.statements = {
      findUserByEmail: this.db.prepare('SELECT * FROM users WHERE email = ?'),
      findUserByProvider: this.db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?'),
      createUser: this.db.prepare(`
        INSERT INTO users (id, email, name, avatar, provider, provider_id, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `),
      updateUserLogin: this.db.prepare(`
        UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),
      createRefreshToken: this.db.prepare(`
        INSERT INTO refresh_tokens (id, user_id, token, expires_at, client_id, scope)
        VALUES (?, ?, ?, ?, ?, ?)
      `),
      findRefreshToken: this.db.prepare(`
        SELECT * FROM refresh_tokens 
        WHERE token = ? AND is_revoked = 0 AND expires_at > CURRENT_TIMESTAMP
      `),
      revokeRefreshToken: this.db.prepare('UPDATE refresh_tokens SET is_revoked = 1 WHERE token = ?'),
      createAuthSession: this.db.prepare(`
        INSERT INTO auth_sessions (id, user_id, access_token, refresh_token, expires_at, user_agent, ip_address, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `),
      findAuthSession: this.db.prepare('SELECT * FROM auth_sessions WHERE access_token = ? AND is_active = 1'),
      revokeAuthSession: this.db.prepare('UPDATE auth_sessions SET is_active = 0 WHERE id = ?'),
      findClient: this.db.prepare('SELECT * FROM oauth_clients WHERE id = ? AND is_active = 1'),
      createAuthCode: this.db.prepare(`
        INSERT INTO authorization_codes (code, client_id, user_id, scope, redirect_uri, expires_at, code_challenge, code_challenge_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `),
      findAuthCode: this.db.prepare(`
        SELECT * FROM authorization_codes 
        WHERE code = ? AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP
      `),
      markAuthCodeUsed: this.db.prepare('UPDATE authorization_codes SET is_used = 1 WHERE code = ?')
    };
  }

  private statements: Record<string, Database.Statement> = {};

  // User methods
  async findUserByEmail(email: string): Promise<User | null> {
    const row = this.statements.findUserByEmail.get(email) as any;
    return row ? this.mapRowToUser(row) : null;
  }

  async findUserByProvider(provider: string, providerId: string): Promise<User | null> {
    const row = this.statements.findUserByProvider.get(provider, providerId) as any;
    return row ? this.mapRowToUser(row) : null;
  }

  async createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    this.statements.createUser.run(
      user.id,
      user.email,
      user.name,
      user.avatar || null,
      user.provider,
      user.providerId,
      JSON.stringify(user.metadata || {})
    );
    
    return {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    this.statements.updateUserLogin.run(userId);
  }

  // Token methods
  async createRefreshToken(token: Omit<RefreshToken, 'createdAt'>): Promise<RefreshToken> {
    this.statements.createRefreshToken.run(
      token.id,
      token.userId,
      token.token,
      token.expiresAt.toISOString(),
      token.clientId || null,
      token.scope ? JSON.stringify(token.scope) : null
    );

    return {
      ...token,
      createdAt: new Date()
    };
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    const row = this.statements.findRefreshToken.get(token) as any;
    return row ? this.mapRowToRefreshToken(row) : null;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    this.statements.revokeRefreshToken.run(token);
  }

  // Session methods
  async createAuthSession(session: Omit<AuthSession, 'createdAt' | 'updatedAt'>): Promise<AuthSession> {
    this.statements.createAuthSession.run(
      session.id,
      session.userId,
      session.accessToken,
      session.refreshToken,
      session.expiresAt.toISOString(),
      session.userAgent || null,
      session.ipAddress || null,
      JSON.stringify(session.metadata || {})
    );

    return {
      ...session,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async findAuthSession(accessToken: string): Promise<AuthSession | null> {
    const row = this.statements.findAuthSession.get(accessToken) as any;
    return row ? this.mapRowToAuthSession(row) : null;
  }

  async revokeAuthSession(sessionId: string): Promise<void> {
    this.statements.revokeAuthSession.run(sessionId);
  }

  // Client methods
  async findClient(clientId: string): Promise<OAuthClient | null> {
    const row = this.statements.findClient.get(clientId) as any;
    return row ? this.mapRowToOAuthClient(row) : null;
  }

  // Authorization code methods
  async createAuthorizationCode(code: Omit<AuthorizationCode, 'createdAt'>): Promise<AuthorizationCode> {
    this.statements.createAuthCode.run(
      code.code,
      code.clientId,
      code.userId,
      JSON.stringify(code.scope),
      code.redirectURI,
      code.expiresAt.toISOString(),
      code.codeChallenge || null,
      code.codeChallengeMethod || null
    );

    return {
      ...code,
      createdAt: new Date()
    };
  }

  async findAuthorizationCode(code: string): Promise<AuthorizationCode | null> {
    const row = this.statements.findAuthCode.get(code) as any;
    return row ? this.mapRowToAuthorizationCode(row) : null;
  }

  async markAuthorizationCodeUsed(code: string): Promise<void> {
    this.statements.markAuthCodeUsed.run(code);
  }

  // Utility methods for mapping database rows to objects
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatar: row.avatar,
      provider: row.provider,
      providerId: row.provider_id,
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
      metadata: JSON.parse(row.metadata || '{}')
    };
  }

  private mapRowToRefreshToken(row: any): RefreshToken {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
      isRevoked: Boolean(row.is_revoked),
      clientId: row.client_id,
      scope: row.scope ? JSON.parse(row.scope) : undefined
    };
  }

  private mapRowToAuthSession(row: any): AuthSession {
    return {
      id: row.id,
      userId: row.user_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isActive: Boolean(row.is_active),
      userAgent: row.user_agent,
      ipAddress: row.ip_address,
      metadata: JSON.parse(row.metadata || '{}')
    };
  }

  private mapRowToOAuthClient(row: any): OAuthClient {
    return {
      id: row.id,
      name: row.name,
      secret: row.secret,
      redirectURIs: JSON.parse(row.redirect_uris),
      scope: JSON.parse(row.scope),
      grantTypes: JSON.parse(row.grant_types),
      responseTypes: JSON.parse(row.response_types),
      isPublic: Boolean(row.is_public),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isActive: Boolean(row.is_active)
    };
  }

  private mapRowToAuthorizationCode(row: any): AuthorizationCode {
    return {
      code: row.code,
      clientId: row.client_id,
      userId: row.user_id,
      scope: JSON.parse(row.scope),
      redirectURI: row.redirect_uri,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
      isUsed: Boolean(row.is_used),
      codeChallenge: row.code_challenge,
      codeChallengeMethod: row.code_challenge_method as 'S256' | 'plain'
    };
  }

  close(): void {
    this.db.close();
  }
}

export const database = new OAuthDatabase();
export default database;
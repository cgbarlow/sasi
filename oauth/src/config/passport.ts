/**
 * F1 OAuth Passport Configuration
 * OAuth provider strategies and user serialization
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import crypto from 'crypto';
import { config } from '../../config/config';
import { database } from '../../storage/database';
import { User, ProviderProfile } from '../../types';

/**
 * User serialization for session management
 */
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Google OAuth 2.0 Strategy
 */
if (config.providers.google.enabled) {
  passport.use(new GoogleStrategy({
    clientID: config.providers.google.clientId,
    clientSecret: config.providers.google.clientSecret,
    callbackURL: config.providers.google.callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await handleOAuthProfile(profile, 'google');
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

/**
 * GitHub OAuth 2.0 Strategy
 */
if (config.providers.github.enabled) {
  passport.use(new GitHubStrategy({
    clientID: config.providers.github.clientId,
    clientSecret: config.providers.github.clientSecret,
    callbackURL: config.providers.github.callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await handleOAuthProfile(profile, 'github');
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

/**
 * Generic OAuth 2.0 Strategy for custom providers
 */
if (config.providers.custom?.enabled) {
  passport.use('custom-oauth', new OAuth2Strategy({
    authorizationURL: config.providers.custom.authorizationURL,
    tokenURL: config.providers.custom.tokenURL,
    clientID: config.providers.custom.clientId,
    clientSecret: config.providers.custom.clientSecret,
    callbackURL: config.providers.custom.callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await handleOAuthProfile(profile, 'custom');
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
}

/**
 * Handle OAuth profile from any provider
 */
async function handleOAuthProfile(profile: ProviderProfile, provider: string): Promise<User> {
  try {
    // Extract profile information
    const providerId = profile.id;
    const email = profile.emails?.[0]?.value || '';
    const name = profile.displayName || profile.name?.givenName + ' ' + profile.name?.familyName || 'Unknown';
    const avatar = profile.photos?.[0]?.value;

    // Check if user exists by provider ID
    let user = await database.findUserByProvider(provider, providerId);
    
    if (user) {
      // Update existing user info
      user.name = name;
      user.avatar = avatar;
      user.lastLoginAt = new Date();
      
      // Update in database (simplified - in production you'd have proper update method)
      await database.db.prepare(`
        UPDATE users SET 
          name = ?, 
          avatar = ?, 
          last_login_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(name, avatar, user.id);
      
      return user;
    }

    // Check if user exists by email
    if (email) {
      user = await database.findUserByEmail(email);
      if (user) {
        // Link this provider to existing account
        // In production, you might want to require user confirmation
        const linkedUser = await database.createUser({
          id: crypto.randomUUID(),
          email: user.email,
          name: name || user.name,
          avatar: avatar || user.avatar,
          provider: provider,
          providerId: providerId,
          isActive: true,
          metadata: {
            linkedAccount: true,
            originalUserId: user.id,
            profileData: profile._json
          }
        });
        
        return linkedUser;
      }
    }

    // Create new user
    const newUser = await database.createUser({
      id: crypto.randomUUID(),
      email: email || `${provider}.${providerId}@oauth.local`,
      name: name,
      avatar: avatar,
      provider: provider,
      providerId: providerId,
      isActive: true,
      metadata: {
        profileData: profile._json,
        firstLogin: true
      }
    });

    return newUser;
  } catch (error) {
    console.error('Error handling OAuth profile:', error);
    throw error;
  }
}

/**
 * Helper function to find user by ID
 */
async function findUserById(id: string): Promise<User | null> {
  try {
    const row = await database.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return row ? mapRowToUser(row) : null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
}

/**
 * Map database row to User object (simplified version)
 */
function mapRowToUser(row: any): User {
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

export default passport;
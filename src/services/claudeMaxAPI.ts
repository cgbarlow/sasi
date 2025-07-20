/**
 * Claude Max API Client
 * Handles all API communication with Claude Max services
 */

import ClaudeMaxAuthService, { ClaudeMaxUser } from './claudeMaxAuth'

export interface APIRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

export interface APIResponse<T = any> {
  data: T
  success: boolean
  rateLimit?: RateLimitInfo
  error?: string
}

export interface ProjectMetadata {
  id: string
  name: string
  description: string
  owner: string
  repositoryUrl: string
  language: string
  stars: number
  forks: number
  issues: number
  lastActivity: Date
  contributors: number
  swarmAllocation: {
    activeAgents: number
    priorityScore: number
    resourceUsage: number
  }
}

export interface AgentStatus {
  id: string
  type: 'researcher' | 'coder' | 'analyst' | 'optimizer' | 'coordinator'
  status: 'active' | 'idle' | 'busy' | 'error'
  currentTask?: string
  performance: {
    tasksCompleted: number
    successRate: number
    averageTime: number
    efficiency: number
  }
  resources: {
    cpuUsage: number
    memoryUsage: number
    networkActivity: number
  }
}

class ClaudeMaxAPIClient {
  private static instance: ClaudeMaxAPIClient
  private authService: ClaudeMaxAuthService
  private baseUrl: string
  private rateLimit: RateLimitInfo | null = null
  private requestQueue: Array<{ resolve: Function; reject: Function; config: any }> = []
  private isProcessingQueue = false

  private constructor() {
    this.authService = ClaudeMaxAuthService.getInstance()
    this.baseUrl = 'https://api.anthropic.com'
  }

  public static getInstance(): ClaudeMaxAPIClient {
    if (!ClaudeMaxAPIClient.instance) {
      ClaudeMaxAPIClient.instance = new ClaudeMaxAPIClient()
    }
    return ClaudeMaxAPIClient.instance
  }

  /**
   * Make authenticated API request with rate limiting and retry logic
   */
  private async makeRequest<T>(
    endpoint: string, 
    config: APIRequestConfig = {}
  ): Promise<APIResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 30000,
      retries = 3
    } = config

    // Get access token
    const accessToken = this.authService.getAccessToken()
    if (!accessToken) {
      throw new Error('No access token available - user not authenticated')
    }

    // Check rate limits
    if (this.rateLimit && this.rateLimit.remaining <= 0) {
      const now = new Date()
      if (now < this.rateLimit.reset) {
        const waitTime = this.rateLimit.reset.getTime() - now.getTime()
        await this.delay(waitTime)
      }
    }

    const requestHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'x-api-key': accessToken,
      'anthropic-version': '2024-01-01',
      'Content-Type': 'application/json',
      'User-Agent': 'SASI-Neural-Swarm/1.0',
      ...headers
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout)
    }

    if (body && method !== 'GET') {
      requestConfig.body = JSON.stringify(body)
    }

    let lastError: Error
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, requestConfig)

        // Update rate limit info from headers
        this.updateRateLimitFromHeaders(response.headers)

        if (response.status === 429) {
          // Rate limited - handle retry after
          const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10)
          if (attempt < retries) {
            await this.delay(retryAfter * 1000)
            continue
          }
          throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`)
        }

        if (response.status === 401) {
          // Unauthorized - try to refresh token
          try {
            await this.authService.refreshAccessToken()
            // Update authorization header and retry
            const newToken = this.authService.getAccessToken()
            if (newToken) {
              requestConfig.headers = {
                ...requestConfig.headers,
                'Authorization': `Bearer ${newToken}`,
                'x-api-key': newToken
              }
              continue
            }
          } catch (refreshError) {
            throw new Error('Authentication failed - please log in again')
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.error?.message || 
            errorData.message || 
            `HTTP ${response.status}: ${response.statusText}`
          )
        }

        const data = await response.json()
        return {
          data,
          success: true,
          rateLimit: this.rateLimit || undefined
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        // Don't retry on certain errors
        if (error instanceof Error && (
          error.name === 'AbortError' ||
          error.message.includes('Authentication failed') ||
          error.message.includes('Rate limit exceeded')
        )) {
          break
        }

        // Exponential backoff for retries
        if (attempt < retries) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000)
          await this.delay(backoffTime)
        }
      }
    }

    return {
      data: null,
      success: false,
      error: lastError.message,
      rateLimit: this.rateLimit || undefined
    }
  }

  /**
   * Update rate limit info from response headers
   */
  private updateRateLimitFromHeaders(headers: Headers): void {
    const limit = headers.get('x-ratelimit-limit')
    const remaining = headers.get('x-ratelimit-remaining')
    const reset = headers.get('x-ratelimit-reset')

    if (limit && remaining && reset) {
      this.rateLimit = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: new Date(parseInt(reset, 10) * 1000)
      }
    }
  }

  /**
   * Delay helper for rate limiting and retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get user profile information
   */
  public async getUserProfile(): Promise<APIResponse<ClaudeMaxUser>> {
    return this.makeRequest<ClaudeMaxUser>('/v1/user/profile')
  }

  /**
   * Get user's projects
   */
  public async getUserProjects(): Promise<APIResponse<ProjectMetadata[]>> {
    return this.makeRequest<ProjectMetadata[]>('/v1/user/projects')
  }

  /**
   * Get project details
   */
  public async getProject(projectId: string): Promise<APIResponse<ProjectMetadata>> {
    return this.makeRequest<ProjectMetadata>(`/v1/projects/${projectId}`)
  }

  /**
   * Create new project
   */
  public async createProject(project: Partial<ProjectMetadata>): Promise<APIResponse<ProjectMetadata>> {
    return this.makeRequest<ProjectMetadata>('/v1/projects', {
      method: 'POST',
      body: project
    })
  }

  /**
   * Update project
   */
  public async updateProject(
    projectId: string, 
    updates: Partial<ProjectMetadata>
  ): Promise<APIResponse<ProjectMetadata>> {
    return this.makeRequest<ProjectMetadata>(`/v1/projects/${projectId}`, {
      method: 'PUT',
      body: updates
    })
  }

  /**
   * Delete project
   */
  public async deleteProject(projectId: string): Promise<APIResponse<void>> {
    return this.makeRequest<void>(`/v1/projects/${projectId}`, {
      method: 'DELETE'
    })
  }

  /**
   * Get user's active agents
   */
  public async getUserAgents(): Promise<APIResponse<AgentStatus[]>> {
    return this.makeRequest<AgentStatus[]>('/v1/user/agents')
  }

  /**
   * Get agent details
   */
  public async getAgent(agentId: string): Promise<APIResponse<AgentStatus>> {
    return this.makeRequest<AgentStatus>(`/v1/agents/${agentId}`)
  }

  /**
   * Spawn new agent
   */
  public async spawnAgent(config: {
    type: AgentStatus['type']
    projectId?: string
    priority?: number
  }): Promise<APIResponse<AgentStatus>> {
    return this.makeRequest<AgentStatus>('/v1/agents', {
      method: 'POST',
      body: config
    })
  }

  /**
   * Stop agent
   */
  public async stopAgent(agentId: string): Promise<APIResponse<void>> {
    return this.makeRequest<void>(`/v1/agents/${agentId}/stop`, {
      method: 'POST'
    })
  }

  /**
   * Get swarm coordination data
   */
  public async getSwarmStatus(): Promise<APIResponse<{
    totalAgents: number
    activeProjects: number
    globalMetrics: {
      tasksCompleted: number
      successRate: number
      networkEfficiency: number
    }
  }>> {
    return this.makeRequest('/v1/swarm/status')
  }

  /**
   * Submit vote for project
   */
  public async voteForProject(
    projectId: string, 
    vote: 'up' | 'down'
  ): Promise<APIResponse<{ voteCount: number; userVote: string }>> {
    return this.makeRequest(`/v1/projects/${projectId}/vote`, {
      method: 'POST',
      body: { vote }
    })
  }

  /**
   * Get trending projects
   */
  public async getTrendingProjects(limit = 20): Promise<APIResponse<ProjectMetadata[]>> {
    return this.makeRequest<ProjectMetadata[]>(`/v1/projects/trending?limit=${limit}`)
  }

  /**
   * Search projects
   */
  public async searchProjects(query: string, filters?: {
    language?: string
    minStars?: number
    sortBy?: 'relevance' | 'stars' | 'updated' | 'votes'
  }): Promise<APIResponse<ProjectMetadata[]>> {
    const params = new URLSearchParams({ q: query })
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, value.toString())
        }
      })
    }
    
    return this.makeRequest<ProjectMetadata[]>(`/v1/projects/search?${params}`)
  }

  /**
   * Get API usage statistics
   */
  public async getUsageStats(): Promise<APIResponse<{
    requestsToday: number
    requestsThisMonth: number
    tokensUsed: number
    tokensRemaining: number
    agentHours: number
  }>> {
    return this.makeRequest('/v1/user/usage')
  }

  /**
   * Test API connectivity
   */
  public async healthCheck(): Promise<APIResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest('/v1/health', { timeout: 5000, retries: 0 })
  }

  /**
   * Get current rate limit status
   */
  public getRateLimitStatus(): RateLimitInfo | null {
    return this.rateLimit
  }
}

export default ClaudeMaxAPIClient
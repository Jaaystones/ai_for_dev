import { NextRequest } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase/client'
import config from '@/lib/config'

// Helper function to get authenticated user
export async function getUser(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

// Helper function to get client IP with proxy support
export function getClientIP(request: NextRequest): string {
  const trustedProxies = config.rateLimiting.trustedProxies
  
  // Try various headers for IP address based on trusted proxies
  if (trustedProxies.length > 0) {
    // If we have trusted proxies, use X-Forwarded-For
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      // Get the first IP (client IP) from the chain
      const ips = forwarded.split(',').map(ip => ip.trim())
      return ips[0] || '127.0.0.1'
    }
  }

  // Cloudflare specific header
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Standard proxy headers
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // Fallback
  return '127.0.0.1'
}

// Helper function to check if IP is whitelisted
export function isWhitelistedIP(ip: string): boolean {
  const whitelistedIPs = config.rateLimiting.whitelistedIPs
  
  if (whitelistedIPs.length === 0) {
    return false
  }
  
  return whitelistedIPs.some(whitelistedIP => {
    // Support CIDR notation for IP ranges
    if (whitelistedIP.includes('/')) {
      return isIPInCIDR(ip, whitelistedIP)
    }
    
    // Exact IP match
    return ip === whitelistedIP
  })
}

// Helper function to check if IP is in CIDR range
function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    const [network, prefixLength] = cidr.split('/')
    const prefix = parseInt(prefixLength, 10)
    
    // Convert IPs to 32-bit integers for comparison
    const ipInt = ipToInt(ip)
    const networkInt = ipToInt(network)
    
    // Create subnet mask
    const mask = 0xFFFFFFFF << (32 - prefix)
    
    return (ipInt & mask) === (networkInt & mask)
  } catch {
    return false
  }
}

// Convert IP address to 32-bit integer
function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => {
    return (acc << 8) + parseInt(octet, 10)
  }, 0) >>> 0 // Unsigned right shift to ensure positive number
}

// Helper function to get user identifier for rate limiting
export function getUserIdentifier(request: NextRequest, user?: any): string {
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || ''
  
  if (user) {
    // For authenticated users, use user ID + IP for better tracking
    return `user:${user.id}:${ip}`
  }
  
  // For anonymous users, use IP + browser fingerprint
  const fingerprint = Buffer.from(`${ip}:${userAgent.slice(0, 100)}`).toString('base64')
  return `anon:${fingerprint}`
}

// Helper function to validate poll access
export async function validatePollAccess(pollId: string, userId?: string) {
  const supabase = createSupabaseClient()
  const { data: poll, error } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single()

  if (error || !poll) {
    return { valid: false, error: 'Poll not found' }
  }

  if (!poll.is_active || new Date(poll.expires_at) < new Date()) {
    return { valid: false, error: 'Poll is no longer active' }
  }

  if (poll.require_auth && !userId) {
    return { valid: false, error: 'Authentication required' }
  }

  return { valid: true, poll }
}

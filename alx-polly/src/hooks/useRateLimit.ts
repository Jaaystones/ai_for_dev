'use client'

import { useState, useCallback } from 'react'

interface RateLimitError {
  rateLimitExceeded: boolean
  type: 'burst' | 'standard'
  limit: number
  remaining: number
  resetTime: number
  error: string
}

interface UseRateLimitOptions {
  onRateLimit?: (error: RateLimitError) => void
  showToast?: boolean
  retryAfterReset?: boolean
}

// Custom toast implementation (replace with your preferred toast library)
const showToast = (message: string, options?: { description?: string; duration?: number }) => {
  console.warn(`Toast: ${message}`, options?.description)
  // Implement with your toast library of choice (react-hot-toast, sonner, etc.)
}

export function useRateLimit(options: UseRateLimitOptions = {}) {
  const { onRateLimit, showToast: showToastOption = true, retryAfterReset = false } = options
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitError | null>(null)

  const handleRateLimitError = useCallback((error: RateLimitError) => {
    setIsRateLimited(true)
    setRateLimitInfo(error)
    
    if (showToastOption) {
      const timeUntilReset = Math.ceil((error.resetTime - Date.now()) / 1000)
      
      showToast(
        `Rate limit exceeded. Try again in ${formatTime(timeUntilReset)}.`,
        {
          description: error.type === 'burst' 
            ? 'Too many requests in a short time'
            : `You've made ${error.limit - error.remaining}/${error.limit} requests`,
          duration: Math.min(timeUntilReset * 1000, 10000) // Show for up to 10 seconds
        }
      )
    }
    
    onRateLimit?.(error)
    
    if (retryAfterReset) {
      const timeUntilReset = error.resetTime - Date.now()
      if (timeUntilReset > 0) {
        setTimeout(() => {
          setIsRateLimited(false)
          setRateLimitInfo(null)
        }, timeUntilReset)
      }
    }
  }, [onRateLimit, showToastOption, retryAfterReset])

  const checkResponse = useCallback(async (response: Response) => {
    if (response.status === 429) {
      try {
        const errorData = await response.json()
        if (errorData.rateLimitExceeded) {
          handleRateLimitError(errorData as RateLimitError)
          return true // Indicates rate limit error was handled
        }
      } catch {
        // If we can't parse the error, show generic rate limit message
        showToast('Rate limit exceeded. Please try again later.')
        setIsRateLimited(true)
        return true
      }
    }
    return false // No rate limit error
  }, [handleRateLimitError])

  const clearRateLimit = useCallback(() => {
    setIsRateLimited(false)
    setRateLimitInfo(null)
  }, [])

  return {
    isRateLimited,
    rateLimitInfo,
    checkResponse,
    handleRateLimitError,
    clearRateLimit
  }
}

// Enhanced fetch function with rate limit handling
export function useFetchWithRateLimit(options: UseRateLimitOptions = {}) {
  const { checkResponse, isRateLimited, rateLimitInfo } = useRateLimit(options)

  const fetchWithRateLimit = useCallback(async (
    url: string, 
    init?: RequestInit
  ): Promise<Response | null> => {
    try {
      const response = await fetch(url, init)
      
      const isRateLimitedResponse = await checkResponse(response)
      if (isRateLimitedResponse) {
        return null // Return null to indicate rate limit error
      }
      
      return response
    } catch (error) {
      console.error('Fetch error:', error)
      throw error
    }
  }, [checkResponse])

  return {
    fetchWithRateLimit,
    isRateLimited,
    rateLimitInfo
  }
}

// Utility function to format time remaining
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`
  }
  
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`
}

// Custom query hook with rate limiting
export function useRateLimitedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: UseRateLimitOptions & { enabled?: boolean } = {}
) {
  const { fetchWithRateLimit, isRateLimited } = useFetchWithRateLimit(options)
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (isRateLimited || options.enabled === false) return

    setIsLoading(true)
    setError(null)
    
    try {
      const result = await queryFn()
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [queryFn, isRateLimited, options.enabled])

  return {
    data,
    error,
    isLoading,
    isRateLimited,
    refetch
  }
}

// Export types for use in other files
export type { RateLimitError, UseRateLimitOptions }

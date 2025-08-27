"use client";

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push(redirectTo)
      } else if (!requireAuth && user) {
        // If user is logged in but trying to access auth pages
        router.push('/')
      }
    }
  }, [user, loading, router, redirectTo, requireAuth])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg bg-white/80 backdrop-blur-lg dark:bg-slate-800/80">
          <CardContent className="p-8 text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-lg font-medium">Loading...</div>
            <div className="text-sm text-muted-foreground">
              Checking authentication status
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If auth check is complete and user meets requirements, render children
  if (requireAuth && user) {
    return <>{children}</>
  }

  if (!requireAuth && !user) {
    return <>{children}</>
  }

  // Otherwise, don't render anything (redirect is happening)
  return null
}

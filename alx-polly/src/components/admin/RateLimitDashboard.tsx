'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Shield, Users, Clock, TrendingUp, RefreshCw } from 'lucide-react'

interface RateLimitStatus {
  ip: string
  rule: string
  count: number
  limit: number
  remaining: number
  resetTime: number
  blocked: boolean
}

interface RateLimitStats {
  totalRequests: number
  blockedRequests: number
  uniqueIPs: number
  topBlocked: RateLimitStatus[]
  recentActivity: RateLimitStatus[]
}

interface RateLimitDashboardProps {
  isAdmin?: boolean
}

export function RateLimitDashboard({ isAdmin = false }: RateLimitDashboardProps) {
  const [stats, setStats] = useState<RateLimitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIP, setSelectedIP] = useState('')
  const [ipStatus, setIPStatus] = useState<RateLimitStatus | null>(null)

  useEffect(() => {
    if (isAdmin) {
      fetchRateLimitStats()
    }
  }, [isAdmin])

  const fetchRateLimitStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/rate-limit/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching rate limit stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkIPStatus = async () => {
    if (!selectedIP) return

    try {
      const response = await fetch(`/api/admin/rate-limit/status?ip=${selectedIP}`)
      if (response.ok) {
        const data = await response.json()
        setIPStatus(data)
      }
    } catch (error) {
      console.error('Error checking IP status:', error)
    }
  }

  const resetIPLimits = async (ip: string) => {
    try {
      const response = await fetch('/api/admin/rate-limit/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip })
      })
      
      if (response.ok) {
        fetchRateLimitStats()
        if (selectedIP === ip) {
          checkIPStatus()
        }
      }
    } catch (error) {
      console.error('Error resetting IP limits:', error)
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5" />
            <span>Admin access required to view rate limiting dashboard</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading rate limit statistics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Rate Limiting Dashboard</h2>
        <Button onClick={fetchRateLimitStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Blocked Requests</p>
                  <p className="text-2xl font-bold">{stats.blockedRequests.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Unique IPs</p>
                  <p className="text-2xl font-bold">{stats.uniqueIPs.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Block Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.totalRequests > 0 
                      ? ((stats.blockedRequests / stats.totalRequests) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* IP Lookup */}
      <Card>
        <CardHeader>
          <CardTitle>IP Address Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address to check status"
              value={selectedIP}
              onChange={(e) => setSelectedIP(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={checkIPStatus}>Check Status</Button>
          </div>

          {ipStatus && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Status for {selectedIP}</h4>
                <Badge variant={ipStatus.blocked ? 'destructive' : 'default'}>
                  {ipStatus.blocked ? 'Blocked' : 'Active'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Rule:</span> {ipStatus.rule}
                </div>
                <div>
                  <span className="text-muted-foreground">Count:</span> {ipStatus.count}/{ipStatus.limit}
                </div>
                <div>
                  <span className="text-muted-foreground">Remaining:</span> {ipStatus.remaining}
                </div>
                <div>
                  <span className="text-muted-foreground">Reset:</span> {new Date(ipStatus.resetTime).toLocaleTimeString()}
                </div>
              </div>
              {ipStatus.blocked && (
                <Button 
                  onClick={() => resetIPLimits(selectedIP)} 
                  variant="destructive" 
                  size="sm"
                >
                  Reset Limits
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Blocked IPs */}
      {stats && stats.topBlocked.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Blocked IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topBlocked.map((status, index) => (
                <div key={`${status.ip}-${status.rule}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{status.ip}</p>
                      <p className="text-sm text-muted-foreground">{status.rule}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <p>{status.count}/{status.limit} requests</p>
                      <p className="text-muted-foreground">
                        Reset: {new Date(status.resetTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button 
                      onClick={() => resetIPLimits(status.ip)} 
                      variant="outline" 
                      size="sm"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {stats && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{activity.ip}</span>
                    <Badge variant={activity.blocked ? 'destructive' : 'secondary'}>
                      {activity.rule}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.count}/{activity.limit} requests
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RateLimitDashboard

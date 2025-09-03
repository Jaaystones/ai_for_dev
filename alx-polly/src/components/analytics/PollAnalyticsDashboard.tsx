'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Poll } from '@/types/poll';
import { PollAnalytics, PollType } from '@/types/pollTypes';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  Smartphone, 
  Monitor, 
  Tablet,
  MapPin,
  Calendar
} from 'lucide-react';

interface PollAnalyticsDashboardProps {
  poll: Poll;
  analytics: PollAnalytics;
}

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export function PollAnalyticsDashboard({ poll, analytics }: PollAnalyticsDashboardProps) {
  const votingData = useMemo(() => {
    return poll.options?.map((option, index) => ({
      name: option.text.length > 20 ? option.text.substring(0, 20) + '...' : option.text,
      votes: option.votes || 0,
      percentage: analytics.totalVotes > 0 ? ((option.votes || 0) / analytics.totalVotes * 100) : 0,
      color: COLORS[index % COLORS.length],
    })) || [];
  }, [poll.options, analytics.totalVotes]);

  const timelineData = useMemo(() => {
    return analytics.votingTimeline?.map((point: any) => ({
      time: new Date(point.timestamp).toLocaleDateString(),
      votes: point.cumulativeVotes,
      newVotes: point.newVotes,
    })) || [];
  }, [analytics.votingTimeline]);

  const deviceData = useMemo(() => {
    return [
      { name: 'Desktop', value: analytics.deviceBreakdown?.desktop || 0, icon: Monitor },
      { name: 'Mobile', value: analytics.deviceBreakdown?.mobile || 0, icon: Smartphone },
      { name: 'Tablet', value: analytics.deviceBreakdown?.tablet || 0, icon: Tablet },
    ].filter(item => item.value > 0);
  }, [analytics.deviceBreakdown]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getEngagementLevel = () => {
    const rate = analytics.engagementRate || 0;
    if (rate >= 0.8) return { level: 'High', color: 'bg-green-500' };
    if (rate >= 0.5) return { level: 'Medium', color: 'bg-yellow-500' };
    return { level: 'Low', color: 'bg-red-500' };
  };

  const engagement = getEngagementLevel();

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Votes</p>
                <p className="text-2xl font-bold">{analytics.totalVotes.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Engagement Rate</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold">
                    {((analytics.engagementRate || 0) * 100).toFixed(1)}%
                  </p>
                  <Badge variant="outline" className={`${engagement.color} text-white border-none`}>
                    {engagement.level}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                <p className="text-2xl font-bold">
                  {formatDuration(analytics.averageResponseTime || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="text-2xl font-bold">
                  {analytics.peakVotingHour || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Voting Results Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Voting Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {votingData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.votes} votes ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={item.percentage} 
                  className="h-3"
                  style={{ 
                    backgroundColor: `${item.color}20`,
                  }}
                />
              </div>
            ))}
          </div>

          {votingData.length > 0 && (
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={votingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value} votes`, 'Votes']}
                    labelFormatter={(label) => `Option: ${label}`}
                  />
                  <Bar dataKey="votes">
                    {votingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voting Timeline */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Voting Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="votes" 
                    stroke="#3B82F6" 
                    fill="#3B82F620" 
                    name="Total Votes"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="newVotes" 
                    stroke="#EF4444" 
                    name="New Votes"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device & Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        {deviceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deviceData.map((device) => {
                  const Icon = device.icon;
                  const percentage = analytics.totalVotes > 0 
                    ? (device.value / analytics.totalVotes * 100) 
                    : 0;
                  
                  return (
                    <div key={device.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{device.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {device.value} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({name, percent}: {name: string, percent?: number}) => 
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Geographic Distribution */}
        {analytics.geographicDistribution && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Geographic Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.geographicDistribution && 
                  Object.entries(analytics.geographicDistribution)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 10)
                    .map(([location, count]) => {
                      const numericCount = count as number;
                      const percentage = analytics.totalVotes > 0 
                        ? (numericCount / analytics.totalVotes * 100) 
                        : 0;
                      
                      return (
                        <div key={location} className="flex justify-between items-center">
                          <span className="text-sm">{location}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={percentage} className="w-16 h-2" />
                            <span className="text-sm text-muted-foreground w-12">
                              {numericCount}
                            </span>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Advanced Metrics for Different Poll Types */}
      {poll.pollType === PollType.RANKING && analytics.rankingAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Ranking Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Average Rankings</h4>
                <div className="space-y-2">
                  {analytics.rankingAnalytics.averageRankings?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">{item.option}</span>
                      <span className="text-sm font-medium">#{item.averageRank.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Consensus Score</h4>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {(analytics.rankingAnalytics.consensusScore * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Agreement Level</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {poll.pollType === PollType.RATING && analytics.ratingAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Rating Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.ratingAnalytics.averageRatings?.map((item: any, index: number) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium text-sm mb-2">{item.option}</h4>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {item.averageRating.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    σ = {item.standardDeviation.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRealtimeConnectionStatus } from "@/hooks/useRealtimeConnectionStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Poll } from "@/types/poll";
import PollVote from "./PollVote";

// Mock data - replace with actual API call
const mockPolls: Poll[] = [
  {
    id: "1",
    question: "What's your favorite programming language for web development?",
    options: [
      { id: "1", text: "JavaScript", votes: 45 },
      { id: "2", text: "Python", votes: 38 },
      { id: "3", text: "TypeScript", votes: 32 },
      { id: "4", text: "Go", votes: 15 }
    ],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    isExpired: false,
    totalVotes: 130
  },
  {
    id: "2",
    question: "Which backend framework do you prefer for enterprise applications?",
    options: [
      { id: "1", text: "Express.js", votes: 25 },
      { id: "2", text: "Django", votes: 30 },
      { id: "3", text: "Spring Boot", votes: 20 },
      { id: "4", text: "FastAPI", votes: 15 }
    ],
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
    expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago (expired)
    isExpired: true,
    totalVotes: 90
  },
  {
    id: "3",
    question: "Best database for high-performance web applications?",
    options: [
      { id: "1", text: "PostgreSQL", votes: 42 },
      { id: "2", text: "MongoDB", votes: 35 },
      { id: "3", text: "MySQL", votes: 28 },
      { id: "4", text: "Redis", votes: 10 }
    ],
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000), // 30 hours ago
    expiresAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago (expired)
    isExpired: true,
    totalVotes: 115
  }
];

export default function PollList() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const isConnected = useRealtimeConnectionStatus();

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPolls(mockPolls);
      setLoading(false);
    }, 1000);
  }, []);

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const timeDiff = expiresAt.getTime() - now.getTime();
    if (timeDiff <= 0) return "Expired";
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const getWinningOption = (poll: Poll) => {
    return poll.options.reduce((prev, current) =>
      prev.votes > current.votes ? prev : current
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg bg-white/80 backdrop-blur-lg dark:bg-slate-800/80">
              <CardContent className="p-8">
                <div className="flex items-center justify-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <div className="text-lg font-medium">Loading amazing polls...</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Real vote API handler
  const handleVote = async (pollId: string, optionId: string) => {
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Vote failed");
      }
      // Update local poll state with latest results
      if (data.poll) {
        setPolls(prevPolls =>
          prevPolls.map(p =>
            p.id === pollId ? { ...p, ...data.poll, options: data.poll.poll_options } : p
          )
        );
      }
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12">
      <div className="container mx-auto px-4">
        {!isConnected && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 text-center font-semibold shadow">
            Reconnecting to live updates...
          </div>
        )}
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto p-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 w-fit">
              <span className="text-4xl">📊</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Poll Results Dashboard
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover what the developer community thinks about programming languages
            </p>
            
            <div className="flex justify-center items-center gap-4 pt-4">
              <Badge variant="outline" className="text-base px-4 py-2 bg-white/70 dark:bg-slate-800/70">
                📈 {polls.length} Total Polls
              </Badge>
              <Badge variant="outline" className="text-base px-4 py-2 bg-white/70 dark:bg-slate-800/70">
                🔥 {polls.filter(p => !p.isExpired).length} Active
              </Badge>
              <Badge variant="outline" className="text-base px-4 py-2 bg-white/70 dark:bg-slate-800/70">
                ✅ {polls.filter(p => p.isExpired).length} Completed
              </Badge>
            </div>
          </div>

          {polls.length === 0 ? (
            <Card className="shadow-lg bg-white/80 backdrop-blur-lg dark:bg-slate-800/80">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="text-6xl">🗳️</div>
                  <h3 className="text-2xl font-semibold">No polls available yet</h3>
                  <p className="text-muted-foreground">Be the first to create an engaging poll!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {polls.map((poll, index) => {
                const winningOption = getWinningOption(poll);
                
                return (
                  <Card 
                    key={poll.id} 
                    className={`overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl border-0 bg-white/90 backdrop-blur-lg dark:bg-slate-800/90 animate-slide-up ${
                      poll.isExpired 
                        ? "ring-2 ring-green-200 dark:ring-green-800" 
                        : "ring-2 ring-blue-200 dark:ring-blue-800"
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`h-1 bg-gradient-to-r ${
                      poll.isExpired 
                        ? "from-green-500 to-emerald-500" 
                        : "from-blue-500 to-purple-500"
                    }`}></div>
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start gap-4">
                        <CardTitle className="text-xl leading-tight flex-1">
                          {poll.question}
                        </CardTitle>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge 
                            variant={poll.isExpired ? "secondary" : "default"}
                            className={`text-sm font-semibold px-3 py-1 ${
                              poll.isExpired 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {poll.isExpired ? "🏁 Completed" : "🔴 Live"}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="text-sm px-3 py-1 bg-white/70 dark:bg-slate-700/70"
                          >
                            👥 {poll.totalVotes} votes
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-base">⏰</span>
                        {poll.isExpired ? (
                          <span className="font-medium text-green-600 dark:text-green-400">
                            Poll completed
                          </span>
                        ) : (
                          <span className="font-medium text-blue-600 dark:text-blue-400 animate-pulse">
                            {formatTimeRemaining(poll.expiresAt)}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Optimistic UI Voting Component */}
                      {!poll.isExpired && (
                        <PollVote poll={poll} onVote={optionId => handleVote(poll.id, optionId)} />
                      )}
                      {/* ...existing code for results display... */}
                      <div className="space-y-4">
                        {poll.options.map((option, optionIndex) => {
                          const percentage = poll.totalVotes > 0 
                            ? Math.round((option.votes / poll.totalVotes) * 100) 
                            : 0;
                          const isWinner = poll.isExpired && option.id === winningOption.id;
                          return (
                            <div 
                              key={option.id} 
                              className="space-y-3 animate-slide-up"
                              style={{ animationDelay: `${(index * 0.1) + (optionIndex * 0.05)}s` }}
                            >
                              <div className="flex justify-between items-center">
                                <div className={`font-semibold text-base flex items-center gap-2 ${
                                  isWinner 
                                    ? 'text-green-700 dark:text-green-400' 
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}>
                                  {isWinner && <span className="text-xl">🏆</span>}
                                  <span>{option.text}</span>
                                  {isWinner && <span className="text-sm text-green-600 dark:text-green-400 ml-1">Winner!</span>}
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium">
                                  <span className="text-slate-600 dark:text-slate-400">
                                    {option.votes} votes
                                  </span>
                                  <span className={`font-bold ${
                                    isWinner 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : 'text-blue-600 dark:text-blue-400'
                                  }`}>
                                    {percentage}%
                                  </span>
                                </div>
                              </div>
                              <div className="relative">
                                <Progress 
                                  value={percentage} 
                                  className={`h-3 ${
                                    isWinner 
                                      ? 'bg-green-100 dark:bg-green-900/30' 
                                      : 'bg-blue-100 dark:bg-blue-900/30'
                                  }`}
                                />
                                {isWinner && (
                                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"
                                       style={{ width: `${percentage}%` }}></div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {poll.isExpired && (
                        <div className="pt-4 border-t border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20 -mx-6 px-6 pb-2 mt-6">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                              <span className="text-base">🎉</span>
                              <span>Final Results:</span>
                            </div>
                            <div className="text-green-600 dark:text-green-400 font-bold">
                              {winningOption.text} wins with {winningOption.votes} votes 
                              ({Math.round((winningOption.votes / poll.totalVotes) * 100)}%)
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          {/* Bottom CTA */}
          <div className="text-center pt-8">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-2xl border-0 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Want to create your own poll?
                </h3>
                <p className="text-blue-100 mb-6">
                  Start engaging conversations with the developer community today!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="/create-poll"
                    className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-lg transition-colors inline-block"
                  >
                    🚀 Create New Poll
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

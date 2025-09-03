'use client';

import { Poll } from '@/types/poll';
import { PollType, PollSettings, PollCategory } from '@/types/pollTypes';
import { MultipleChoiceVoting } from './voting/MultipleChoiceVoting';
import { RankingVoting } from './voting/RankingVoting';
import { RatingVoting } from './voting/RatingVoting';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePollVoting } from '@/hooks/usePollVoting';
import { useState } from 'react';
import { Clock, Users, BarChart3 } from 'lucide-react';

interface PollCardProps {
  poll: Poll & {
    pollType?: PollType;
    settings?: PollSettings;
  };
  onVoteSuccess?: () => void;
  showResults?: boolean;
  disabled?: boolean;
}

export function PollCard({ 
  poll, 
  onVoteSuccess, 
  showResults = false, 
  disabled = false 
}: PollCardProps) {
  const [currentView, setCurrentView] = useState<'vote' | 'results'>('vote');
  const { vote, isVoting, error } = usePollVoting();

  const pollType = poll.pollType || PollType.SINGLE_CHOICE;
  const settings: PollSettings = poll.settings || {
    pollType: pollType,
    category: PollCategory.GENERAL,
  };

  const handleSingleChoiceVote = async (optionId: string) => {
    try {
      await vote(poll.id, optionId);
      onVoteSuccess?.();
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  };

  const getTotalVotes = () => {
    return poll.options?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0;
  };

  const getPollTypeLabel = () => {
    switch (pollType) {
      case PollType.SINGLE_CHOICE: return 'Single Choice';
      case PollType.MULTIPLE_CHOICE: return 'Multiple Choice';
      case PollType.RANKING: return 'Ranking';
      case PollType.RATING: return 'Rating';
      case PollType.TEXT_INPUT: return 'Text Response';
      default: return 'Poll';
    }
  };

  const renderVotingInterface = () => {
    if (showResults || currentView === 'results') {
      return renderResults();
    }

    switch (pollType) {
      case PollType.MULTIPLE_CHOICE:
        return (
          <MultipleChoiceVoting
            poll={poll}
            settings={settings}
            onVoteSuccess={onVoteSuccess}
            disabled={disabled}
          />
        );
      
      case PollType.RANKING:
        return (
          <RankingVoting
            poll={poll}
            settings={settings}
            onVoteSuccess={onVoteSuccess}
            disabled={disabled}
          />
        );
      
      case PollType.RATING:
        return (
          <RatingVoting
            poll={poll}
            settings={settings}
            onVoteSuccess={onVoteSuccess}
            disabled={disabled}
          />
        );
      
      case PollType.SINGLE_CHOICE:
      default:
        return renderSingleChoiceVoting();
    }
  };

  const renderSingleChoiceVoting = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{poll.question}</CardTitle>
          <Badge variant="outline">{getPollTypeLabel()}</Badge>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{getTotalVotes()} votes</span>
          </div>
          {poll.createdAt && (
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(poll.createdAt)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {poll.options?.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className="w-full justify-start p-4 h-auto"
              onClick={() => handleSingleChoiceVote(option.id)}
              disabled={disabled || isVoting}
            >
              <div className="flex justify-between items-center w-full">
                <span>{option.text}</span>
                {option.votes !== undefined && (
                  <Badge variant="secondary">{option.votes}</Badge>
                )}
              </div>
            </Button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('results')}
            className="flex items-center space-x-1"
          >
            <BarChart3 className="w-4 h-4" />
            <span>View Results</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    const totalVotes = getTotalVotes();
    
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{poll.question}</CardTitle>
            <Badge variant="outline">{getPollTypeLabel()}</Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{totalVotes} votes</span>
            </div>
            {poll.createdAt && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatDate(poll.createdAt)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {poll.options?.map((option) => {
              const votes = option.votes || 0;
              const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
              
              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{option.text}</span>
                    <span className="text-sm text-muted-foreground">
                      {votes} votes ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {!showResults && (
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('vote')}
              >
                Back to Voting
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {renderVotingInterface()}
    </div>
  );
}

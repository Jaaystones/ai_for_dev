'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Poll } from '@/types/poll';
import { PollSettings } from '@/types/pollTypes';
import { useAdvancedVoting } from '@/hooks/useAdvancedVoting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ThumbsUp, Heart } from 'lucide-react';

interface RatingVotingProps {
  poll: Poll;
  settings: PollSettings;
  onVoteSuccess?: () => void;
  disabled?: boolean;
}

interface RatedOption {
  optionId: string;
  rating: number;
}

export function RatingVoting({ 
  poll, 
  settings, 
  onVoteSuccess, 
  disabled = false 
}: RatingVotingProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);

  const { voteRating, isVoting, error, clearError } = useAdvancedVoting();

  const maxRating = settings.maxRating || 5;
  const minRating = settings.minRating || 1;
  const scaleType = settings.scaleType || 'stars';

  const handleRatingChange = useCallback((optionId: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [optionId]: rating,
    }));
    clearError();
  }, [clearError]);

  const canSubmit = () => {
    const requiredRatings = poll.options?.length || 0;
    const providedRatings = Object.keys(ratings).length;
    
    if (settings.requireAllRatings && providedRatings < requiredRatings) {
      return false;
    }
    
    if (settings.minSelections && providedRatings < settings.minSelections) {
      return false;
    }
    
    if (settings.requireReason && !reason.trim()) {
      return false;
    }
    
    return providedRatings > 0;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    try {
      const ratingData: RatedOption[] = Object.entries(ratings).map(([optionId, rating]) => ({
        optionId,
        rating,
      }));

      await voteRating(poll.id, ratingData, reason || undefined);
      onVoteSuccess?.();
    } catch (err) {
      console.error('Failed to submit rating vote:', err);
    }
  };

  const renderRatingScale = (optionId: string, currentRating: number) => {
    const items = [];
    
    for (let i = minRating; i <= maxRating; i++) {
      items.push(
        <button
          key={i}
          onClick={() => !disabled && handleRatingChange(optionId, i)}
          disabled={disabled}
          className={`p-1 rounded transition-colors ${
            disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer hover:bg-gray-100'
          }`}
          title={`Rate ${i} out of ${maxRating}`}
        >
          {scaleType === 'stars' && (
            <Star 
              className={`w-6 h-6 ${
                i <= currentRating 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              }`} 
            />
          )}
          {scaleType === 'thumbs' && i <= 2 && (
            <ThumbsUp 
              className={`w-6 h-6 ${
                (i === 1 && currentRating >= 1) || (i === 2 && currentRating >= 2)
                  ? 'fill-green-500 text-green-500' 
                  : 'text-gray-300'
              } ${i === 1 ? 'rotate-180' : ''}`} 
            />
          )}
          {scaleType === 'hearts' && (
            <Heart 
              className={`w-6 h-6 ${
                i <= currentRating 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-gray-300'
              }`} 
            />
          )}
          {scaleType === 'numbers' && (
            <span 
              className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-medium ${
                i <= currentRating 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'text-gray-500 border-gray-300'
              }`}
            >
              {i}
            </span>
          )}
        </button>
      );
    }
    
    return items;
  };

  const getRatingText = (rating: number) => {
    if (scaleType === 'numbers') return `${rating}/${maxRating}`;
    if (scaleType === 'stars') return `${rating} ${rating === 1 ? 'star' : 'stars'}`;
    if (scaleType === 'hearts') return `${rating} ${rating === 1 ? 'heart' : 'hearts'}`;
    if (scaleType === 'thumbs') return rating >= 2 ? 'Thumbs up' : 'Thumbs down';
    return `${rating}`;
  };

  const getScaleDescription = () => {
    if (scaleType === 'thumbs' && maxRating === 2) {
      return 'Rate each option: thumbs down (1) or thumbs up (2)';
    }
    return `Rate each option from ${minRating} to ${maxRating}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{poll.question}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {getScaleDescription()}
          {settings.requireAllRatings && ' (all options required)'}
          {settings.minSelections && ` (rate at least ${settings.minSelections} options)`}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {poll.options?.map((option) => {
            const currentRating = ratings[option.id] || 0;
            
            return (
              <div key={option.id} className="space-y-2">
                <Label className="text-sm font-medium">
                  {option.text}
                  {option.votes !== undefined && (
                    <span className="ml-2 text-muted-foreground">
                      ({option.votes} votes)
                    </span>
                  )}
                </Label>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {renderRatingScale(option.id, currentRating)}
                  </div>
                  
                  {currentRating > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {getRatingText(currentRating)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRatingChange(option.id, 0)}
                        disabled={disabled}
                        className="text-xs px-2 py-1 h-6"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {settings.requireReason && (
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for your ratings (required)</Label>
            <Textarea
              id="reason"
              placeholder="Please explain your ratings..."
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
              disabled={disabled}
              rows={3}
            />
          </div>
        )}

        {!settings.requireReason && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-reason"
                checked={showReason}
                onChange={(e) => setShowReason(e.target.checked)}
                disabled={disabled}
                className="rounded"
              />
              <Label htmlFor="show-reason">Add reasoning (optional)</Label>
            </div>
            {showReason && (
              <Textarea
                placeholder="Explain your ratings (optional)..."
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                disabled={disabled}
                rows={3}
              />
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            {settings.requireAllRatings && Object.keys(ratings).length < (poll.options?.length || 0) && (
              <span className="text-red-600">
                Please rate all options
              </span>
            )}
            {settings.minSelections && Object.keys(ratings).length < settings.minSelections && (
              <span className="text-red-600">
                Rate at least {settings.minSelections} options
              </span>
            )}
            {Object.keys(ratings).length > 0 && (
              <span>
                {Object.keys(ratings).length} of {poll.options?.length || 0} options rated
              </span>
            )}
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || disabled || isVoting}
            className="min-w-24"
          >
            {isVoting ? 'Submitting...' : 'Submit Ratings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Poll } from '@/types/poll';
import { PollSettings } from '@/types/pollTypes';
import { useAdvancedVoting } from '@/hooks/useAdvancedVoting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MultipleChoiceVotingProps {
  poll: Poll;
  settings: PollSettings;
  onVoteSuccess?: () => void;
  disabled?: boolean;
}

export function MultipleChoiceVoting({ 
  poll, 
  settings, 
  onVoteSuccess, 
  disabled = false 
}: MultipleChoiceVotingProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);

  const { voteMultipleChoice, isVoting, error, clearError } = useAdvancedVoting();

  const handleOptionToggle = useCallback((optionId: string) => {
    setSelectedOptions(prev => {
      const isSelected = prev.includes(optionId);
      let newSelection;

      if (isSelected) {
        newSelection = prev.filter(id => id !== optionId);
      } else {
        // Check max selections limit
        if (settings.maxSelections && prev.length >= settings.maxSelections) {
          return prev; // Don't add more if at limit
        }
        newSelection = [...prev, optionId];
      }

      clearError();
      return newSelection;
    });
  }, [settings.maxSelections, clearError]);

  const canSubmit = () => {
    const minMet = !settings.minSelections || selectedOptions.length >= settings.minSelections;
    const maxMet = !settings.maxSelections || selectedOptions.length <= settings.maxSelections;
    return selectedOptions.length > 0 && minMet && maxMet;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    try {
      await voteMultipleChoice(
        poll.id,
        selectedOptions,
        otherText || undefined,
        reason || undefined
      );
      onVoteSuccess?.();
    } catch (err) {
      console.error('Failed to submit vote:', err);
    }
  };

  const getSelectionText = () => {
    const { minSelections, maxSelections } = settings;
    if (minSelections && maxSelections) {
      return `Select ${minSelections}-${maxSelections} options`;
    }
    if (minSelections) {
      return `Select at least ${minSelections} options`;
    }
    if (maxSelections) {
      return `Select up to ${maxSelections} options`;
    }
    return 'Select multiple options';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{poll.question}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {getSelectionText()}
          {selectedOptions.length > 0 && ` (${selectedOptions.length} selected)`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {poll.options?.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            const isDisabled = disabled || 
              (settings.maxSelections && 
               selectedOptions.length >= settings.maxSelections && 
               !isSelected);

            return (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={isSelected}
                  onCheckedChange={() => handleOptionToggle(option.id)}
                  disabled={!!isDisabled}
                />
                <Label 
                  htmlFor={option.id}
                  className={`flex-1 ${isDisabled ? 'opacity-50' : 'cursor-pointer'}`}
                >
                  {option.text}
                  {option.votes !== undefined && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({option.votes} votes)
                    </span>
                  )}
                </Label>
              </div>
            );
          })}
        </div>

        {(settings.allowOtherOption || settings.allowOther) && (
          <div className="space-y-2">
            <Label htmlFor="other-text">Other (please specify)</Label>
            <Textarea
              id="other-text"
              placeholder="Enter your custom option..."
              value={otherText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOtherText(e.target.value)}
              disabled={disabled}
              rows={2}
            />
          </div>
        )}

        {settings.requireReason && (
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for your choices (required)</Label>
            <Textarea
              id="reason"
              placeholder="Please explain your choices..."
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
              <Checkbox
                id="show-reason"
                checked={showReason}
                onCheckedChange={(checked) => setShowReason(checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="show-reason">Add reasoning (optional)</Label>
            </div>
            {showReason && (
              <Textarea
                placeholder="Explain your choices (optional)..."
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
            {settings.maxSelections && selectedOptions.length >= settings.maxSelections && (
              <span className="text-amber-600">Maximum selections reached</span>
            )}
            {settings.minSelections && selectedOptions.length < settings.minSelections && (
              <span className="text-red-600">
                Select at least {settings.minSelections} options
              </span>
            )}
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || disabled || isVoting || 
              (settings.requireReason && !reason.trim())}
            className="min-w-24"
          >
            {isVoting ? 'Submitting...' : 'Submit Vote'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

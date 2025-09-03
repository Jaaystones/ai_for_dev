'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Poll } from '@/types/poll';
import { PollSettings } from '@/types/pollTypes';
import { useAdvancedVoting } from '@/hooks/useAdvancedVoting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

interface RankingVotingProps {
  poll: Poll;
  settings: PollSettings;
  onVoteSuccess?: () => void;
  disabled?: boolean;
}

interface RankedOption {
  id: string;
  text: string;
  rank: number;
}

export function RankingVoting({ 
  poll, 
  settings, 
  onVoteSuccess, 
  disabled = false 
}: RankingVotingProps) {
  const [rankedOptions, setRankedOptions] = useState<RankedOption[]>(() => 
    poll.options?.map((option, index) => ({
      id: option.id,
      text: option.text,
      rank: index + 1,
    })) || []
  );
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);

  const { voteRanking, isVoting, error, clearError } = useAdvancedVoting();

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || disabled) return;

    const items = Array.from(rankedOptions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update ranks
    const updatedItems = items.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    setRankedOptions(updatedItems);
    clearError();
  }, [rankedOptions, disabled, clearError]);

  const moveOption = useCallback((fromIndex: number, direction: 'up' | 'down') => {
    if (disabled) return;
    
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= rankedOptions.length) return;

    const items = Array.from(rankedOptions);
    const [item] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, item);

    // Update ranks
    const updatedItems = items.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    setRankedOptions(updatedItems);
    clearError();
  }, [rankedOptions, disabled, clearError]);

  const canSubmit = () => {
    const minRanked = settings.minSelections || 1;
    return rankedOptions.length >= minRanked && (!settings.requireReason || reason.trim());
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    try {
      const rankings = rankedOptions.map(option => ({
        optionId: option.id,
        rank: option.rank,
      }));

      await voteRanking(poll.id, rankings, reason || undefined);
      onVoteSuccess?.();
    } catch (err) {
      console.error('Failed to submit ranking vote:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{poll.question}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag and drop to rank the options, or use the arrow buttons
          {settings.minSelections && ` (rank at least ${settings.minSelections})`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="ranking-options">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-2 p-2 rounded-lg border ${
                  snapshot.isDraggingOver ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}
              >
                {rankedOptions.map((option, index) => (
                  <Draggable
                    key={option.id}
                    draggableId={option.id}
                    index={index}
                    isDragDisabled={disabled}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center space-x-3 p-3 bg-white rounded-lg border shadow-sm ${
                          snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''
                        } ${disabled ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center text-lg font-medium text-blue-600 min-w-[2rem]">
                          #{option.rank}
                        </div>
                        
                        <div
                          {...provided.dragHandleProps}
                          className={`cursor-grab active:cursor-grabbing ${disabled ? 'cursor-not-allowed' : ''}`}
                        >
                          <GripVertical className="w-5 h-5 text-gray-400" />
                        </div>
                        
                        <div className="flex-1 text-sm font-medium">
                          {option.text}
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveOption(index, 'up')}
                            disabled={disabled || index === 0}
                            className="p-1 h-6 w-6"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moveOption(index, 'down')}
                            disabled={disabled || index === rankedOptions.length - 1}
                            className="p-1 h-6 w-6"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {settings.requireReason && (
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for your ranking (required)</Label>
            <Textarea
              id="reason"
              placeholder="Please explain your ranking..."
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
                placeholder="Explain your ranking (optional)..."
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
            {settings.minSelections && rankedOptions.length < settings.minSelections && (
              <span className="text-red-600">
                Rank at least {settings.minSelections} options
              </span>
            )}
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || disabled || isVoting}
            className="min-w-24"
          >
            {isVoting ? 'Submitting...' : 'Submit Ranking'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

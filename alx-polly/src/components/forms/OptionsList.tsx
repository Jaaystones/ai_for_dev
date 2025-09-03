import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptionTagProps {
  option: string;
  onRemove: (option: string) => void;
  animationDelay?: number;
  disabled?: boolean;
}

export function OptionTag({ option, onRemove, animationDelay = 0, disabled = false }: OptionTagProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-lg text-sm font-medium transition-all hover:bg-blue-200 dark:hover:bg-blue-900/30 animate-in slide-in-from-left-2",
        disabled && "opacity-50"
      )}
      style={{ 
        animationDelay: `${animationDelay}s`,
        animationDuration: '0.3s'
      }}
    >
      <span>{option}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
        onClick={() => onRemove(option)}
        disabled={disabled}
      >
        <X className="h-3 w-3 text-red-500" />
      </Button>
    </div>
  );
}

interface OptionsListProps {
  options: string[];
  onRemove: (option: string) => void;
  minOptions?: number;
  maxOptions?: number;
  disabled?: boolean;
  className?: string;
}

export function OptionsList({ 
  options, 
  onRemove, 
  minOptions = 2, 
  maxOptions = 10,
  disabled = false,
  className 
}: OptionsListProps) {
  if (options.length === 0) return null;

  const isReady = options.length >= minOptions;
  const isAtMax = options.length >= maxOptions;

  return (
    <div className={cn(
      "space-y-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 transition-all",
      className
    )}>
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <span className="text-lg">📝</span>
          Selected Options ({options.length})
        </Label>
        
        {isReady && (
          <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 animate-in slide-in-from-right-1">
            <span>✓</span> 
            Ready to publish
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3">
        {options.map((option, index) => (
          <OptionTag 
            key={option} 
            option={option} 
            onRemove={onRemove}
            animationDelay={index * 0.1}
            disabled={disabled}
          />
        ))}
      </div>
      
      {!isReady && (
        <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2 animate-pulse">
          <span>⚠️</span>
          Add at least {minOptions - options.length} more option{minOptions - options.length !== 1 ? 's' : ''} to create your poll
        </p>
      )}
      
      {isAtMax && (
        <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2">
          <span>🚫</span>
          Maximum {maxOptions} options reached
        </p>
      )}
    </div>
  );
}

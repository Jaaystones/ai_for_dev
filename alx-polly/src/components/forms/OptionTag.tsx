import { memo, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import config from '@/lib/config';

interface OptionTagProps {
  option: string;
  onRemove: (option: string) => void;
  animationDelay?: number;
  disabled?: boolean;
}

export const OptionTag = memo<OptionTagProps>(({ 
  option, 
  onRemove, 
  animationDelay = 0,
  disabled = false 
}) => {
  const handleRemove = useCallback(() => {
    if (!disabled) {
      onRemove(option);
    }
  }, [option, onRemove, disabled]);

  const animationStyle = useMemo(() => ({
    animationDelay: `${animationDelay}s`,
  }), [animationDelay]);

  return (
    <div 
      className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full animate-fade-in hover:scale-105 transition-transform duration-200"
      style={animationStyle}
    >
      <span className="font-medium text-sm">{option}</span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleRemove}
        disabled={disabled}
        className="h-5 w-5 p-0 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
        aria-label={`Remove ${option}`}
      >
        ×
      </Button>
    </div>
  );
});

OptionTag.displayName = 'OptionTag';

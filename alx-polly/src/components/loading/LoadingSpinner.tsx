import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export function LoadingSpinner({ size = "md", message, className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      <div className={cn(
        "animate-spin rounded-full border-b-2 border-blue-600",
        sizeClasses[size]
      )} />
      {message && (
        <p className="text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}

// Inline spinner for buttons
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("animate-spin rounded-full h-4 w-4 border-b-2 border-current", className)} />
  );
}

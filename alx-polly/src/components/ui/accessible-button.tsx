import React, { forwardRef, useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import config from '@/lib/config';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:scale-95',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:scale-95',
        link: 'text-primary underline-offset-4 hover:underline active:scale-95',
        gradient: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 active:scale-95 shadow-lg hover:shadow-xl',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
      loading: {
        true: 'cursor-not-allowed',
        false: '',
      },
      animation: {
        none: '',
        pulse: 'animate-pulse',
        bounce: 'animate-bounce',
        spin: 'animate-spin',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      loading: false,
      animation: 'none',
    },
  }
);

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  analytics?: {
    category?: string;
    action?: string;
    label?: string;
  };
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false,
    loadingText,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    animation,
    analytics,
    children,
    onClick,
    disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;
    
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled || !onClick) return;
      
      // Analytics tracking
      if (analytics && typeof window !== 'undefined') {
        // This would integrate with the analytics system
        console.log('Button clicked:', analytics);
      }
      
      // Haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      onClick(event);
    };

    const buttonContent = useMemo(() => {
      if (loading && loadingText) {
        return (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            {loadingText}
          </>
        );
      }

      if (loading) {
        return (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            {children}
          </>
        );
      }

      if (!icon) return children;

      return (
        <>
          {iconPosition === 'left' && <span className="mr-2">{icon}</span>}
          {children}
          {iconPosition === 'right' && <span className="ml-2">{icon}</span>}
        </>
      );
    }, [loading, loadingText, children, icon, iconPosition]);

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, loading, animation, className }),
          fullWidth && 'w-full',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          // High contrast mode support
          'forced-colors:border-[ButtonBorder] forced-colors:text-[ButtonText]'
        )}
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-describedby={ariaDescribedby}
        aria-busy={loading}
        // Enhanced ARIA attributes
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export { AccessibleButton, buttonVariants };

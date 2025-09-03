import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  icon?: string;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ 
  label, 
  icon, 
  error, 
  required, 
  description, 
  className,
  children 
}: FormFieldProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-base font-semibold flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      {children}
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2 animate-in slide-in-from-left-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
      
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// Specialized form field for text inputs
export function TextFormField({ 
  label, 
  icon, 
  error, 
  required, 
  description, 
  className,
  children 
}: FormFieldProps) {
  return (
    <FormField
      label={label}
      icon={icon}
      error={error}
      required={required}
      description={description}
      className={className}
    >
      <div className={cn(
        "transition-colors",
        error && "animate-shake"
      )}>
        {children}
      </div>
    </FormField>
  );
}

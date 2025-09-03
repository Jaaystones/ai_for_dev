'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';
import { CreatePollSchema, CreatePollInput } from '@/lib/validations/poll';

export function usePollFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: keyof CreatePollInput, value: any) => {
    try {
      // Get the field schema
      const fieldSchema = CreatePollSchema.shape[field];
      fieldSchema.parse(value);
      
      // Clear error if validation passes
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ 
          ...prev, 
          [field]: error.issues[0].message 
        }));
      }
      return false;
    }
  }, []);

  const validateForm = useCallback((data: CreatePollInput) => {
    try {
      CreatePollSchema.parse(data);
      setErrors({});
      return { success: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err: z.ZodIssue) => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return { success: false, errors: fieldErrors };
      }
      return { success: false, errors: { general: 'Validation failed' } };
    }
  }, []);

  const clearErrors = useCallback(() => setErrors({}), []);
  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return { 
    errors, 
    validateField, 
    validateForm, 
    clearErrors, 
    clearError,
    hasErrors: Object.keys(errors).length > 0 
  };
}

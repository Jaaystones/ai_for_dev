import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  message?: string;
}

export function AsyncErrorBoundary({ 
  children, 
  title = "Failed to Load",
  message = "There was an error loading this content. Please try again."
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="max-w-md mx-auto my-8">
          <CardContent className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            
            <Button onClick={() => window.location.reload()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Specialized error boundary for forms
export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AsyncErrorBoundary
      title="Form Error"
      message="There was an error with the form. Please refresh and try again."
    >
      {children}
    </AsyncErrorBoundary>
  );
}

// Specialized error boundary for data fetching
export function DataErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AsyncErrorBoundary
      title="Data Loading Error"
      message="Failed to load data. Please check your connection and try again."
    >
      {children}
    </AsyncErrorBoundary>
  );
}

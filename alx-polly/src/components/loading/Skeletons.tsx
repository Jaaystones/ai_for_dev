import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function PollSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
          ))}
        </div>
        
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PollListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }, (_, i) => (
        <PollSkeleton key={i} />
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        </div>
        
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </CardContent>
    </Card>
  );
}

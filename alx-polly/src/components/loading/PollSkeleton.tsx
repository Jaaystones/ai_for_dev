import { memo, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import config from '@/lib/config';

interface PollSkeletonProps {
  count?: number;
  showVoting?: boolean;
}

const SinglePollSkeleton = memo(() => (
  <Card className="animate-pulse">
    <CardContent className="p-6 space-y-4">
      {/* Title */}
      <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-3/4 animate-shimmer" />
      
      {/* Description */}
      <div className="space-y-2">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-full animate-shimmer" />
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-5/6 animate-shimmer" />
      </div>
      
      {/* Options */}
      <div className="space-y-3">
        <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer" />
        <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer" />
        <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-4/5 animate-shimmer" />
      </div>
      
      {/* Stats */}
      <div className="flex gap-4 pt-2">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-20 animate-shimmer" />
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-16 animate-shimmer" />
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-24 animate-shimmer" />
      </div>
    </CardContent>
  </Card>
));

SinglePollSkeleton.displayName = 'SinglePollSkeleton';

export const PollSkeleton = memo<PollSkeletonProps>(({ 
  count = config.ui.skeletonCount,
  showVoting = true 
}) => {
  const skeletons = useMemo(() => 
    Array.from({ length: count }, (_, i) => (
      <SinglePollSkeleton key={`skeleton-${i}`} />
    )), [count]
  );

  return (
    <div className="space-y-6">
      {skeletons}
    </div>
  );
});

PollSkeleton.displayName = 'PollSkeleton';

// Form skeleton for create poll page
export const CreatePollSkeleton = memo(() => (
  <Card className="w-full max-w-3xl mx-auto animate-pulse">
    <CardContent className="p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/2 mx-auto animate-shimmer" />
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-3/4 mx-auto animate-shimmer" />
      </div>
      
      {/* Form fields */}
      <div className="space-y-6">
        {/* Question field */}
        <div className="space-y-3">
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-32 animate-shimmer" />
          <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer" />
        </div>
        
        {/* Description field */}
        <div className="space-y-3">
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-28 animate-shimmer" />
          <div className="h-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer" />
        </div>
        
        {/* Options section */}
        <div className="space-y-4">
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-40 animate-shimmer" />
          <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer" />
          <div className="flex gap-3">
            <div className="h-8 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 dark:from-blue-700 dark:via-blue-600 dark:to-blue-700 rounded-full w-24 animate-shimmer" />
            <div className="h-8 bg-gradient-to-r from-purple-200 via-purple-300 to-purple-200 dark:from-purple-700 dark:via-purple-600 dark:to-purple-700 rounded-full w-28 animate-shimmer" />
          </div>
        </div>
        
        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-32 animate-shimmer" />
            <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-shimmer" />
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-40 animate-shimmer" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-shimmer" />
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-32 animate-shimmer" />
            </div>
          </div>
        </div>
        
        {/* Submit button */}
        <div className="h-12 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 dark:from-blue-700 dark:via-blue-600 dark:to-blue-700 rounded animate-shimmer" />
      </div>
    </CardContent>
  </Card>
));

CreatePollSkeleton.displayName = 'CreatePollSkeleton';

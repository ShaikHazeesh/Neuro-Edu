import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface OfflineBadgeProps {
  className?: string;
  showSyncButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  floating?: boolean;
}

/**
 * Offline badge component that shows offline status and sync button
 */
export const OfflineBadge: React.FC<OfflineBadgeProps> = ({
  className,
  showSyncButton = true,
  size = 'md',
  position = 'top-right',
  floating = false,
}) => {
  const { isOnline, isSyncing, hasPendingItems, sync } = useOfflineSync({
    showNotifications: true,
    autoSync: true,
  });

  // If online and no pending items, don't render anything
  if (isOnline && !hasPendingItems) {
    return null;
  }

  // Determine size classes
  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-1.5 px-3',
    lg: 'text-base py-2 px-4',
  };

  // Determine position classes
  const positionClasses = {
    'top-right': 'top-2 right-2',
    'bottom-right': 'bottom-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-left': 'bottom-2 left-2',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        floating && 'fixed z-50',
        floating && positionClasses[position],
        className
      )}
    >
      {!isOnline && (
        <div
          className={cn(
            'flex items-center bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full',
            sizeClasses[size]
          )}
        >
          <WifiOff
            className={cn('mr-1', {
              'h-3 w-3': size === 'sm',
              'h-4 w-4': size === 'md',
              'h-5 w-5': size === 'lg',
            })}
          />
          Offline
        </div>
      )}

      {isOnline && hasPendingItems && showSyncButton && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={sync}
                disabled={isSyncing}
                className={cn('rounded-full', {
                  'h-6 w-6': size === 'sm',
                  'h-8 w-8': size === 'md',
                  'h-10 w-10': size === 'lg',
                })}
              >
                <RefreshCw
                  className={cn(isSyncing && 'animate-spin', {
                    'h-3 w-3': size === 'sm',
                    'h-4 w-4': size === 'md',
                    'h-5 w-5': size === 'lg',
                  })}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sync offline progress</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}; 
import { useState, useEffect, useCallback } from 'react';
import { syncService } from '@/utils/syncService';
import { getPendingSyncItems } from '@/utils/localStorageUtils';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface UseSyncOptions {
  showNotifications?: boolean;
  autoSync?: boolean;
  invalidateQueries?: string[];
}

/**
 * Hook for handling offline-to-online synchronization in React components
 */
export const useOfflineSync = (options?: UseSyncOptions) => {
  const {
    showNotifications = true,
    autoSync = true,
    invalidateQueries = []
  } = options || {};
  
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [hasPendingItems, setHasPendingItems] = useState<boolean>(false);
  const [hasReconnected, setHasReconnected] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check for pending items
  const checkPendingItems = useCallback(() => {
    const pendingItems = getPendingSyncItems();
    setHasPendingItems(pendingItems.length > 0);
    return pendingItems.length > 0;
  }, []);
  
  // Sync function
  const sync = useCallback(async () => {
    if (!isOnline) {
      if (showNotifications) {
        toast({
          title: "Can't Sync",
          description: "You are currently offline. Your progress will be synchronized when you're back online.",
          variant: "destructive",
        });
      }
      return false;
    }
    
    setIsSyncing(true);
    
    try {
      const result = await syncService.synchronize();
      
      if (result) {
        // Invalidate queries after successful sync
        if (invalidateQueries.length > 0) {
          invalidateQueries.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
          });
        }
        
        if (showNotifications) {
          toast({
            title: "Sync Complete",
            description: "Your offline progress has been synchronized successfully.",
            variant: "default",
          });
        }
      } else if (showNotifications) {
        toast({
          title: "Sync Incomplete",
          description: "Some items could not be synchronized. They will be retried later.",
          variant: "destructive",
        });
      }
      
      checkPendingItems();
      return result;
    } catch (error) {
      console.error("Error during sync:", error);
      
      if (showNotifications) {
        toast({
          title: "Sync Failed",
          description: "An error occurred while synchronizing. Please try again later.",
          variant: "destructive",
        });
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, showNotifications, invalidateQueries, queryClient, toast, checkPendingItems]);
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setHasReconnected(true);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setHasReconnected(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOnline(navigator.onLine);
    checkPendingItems();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkPendingItems]);
  
  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && hasReconnected && hasPendingItems && autoSync) {
      sync();
      setHasReconnected(false);
    }
  }, [isOnline, hasReconnected, hasPendingItems, autoSync, sync]);
  
  return {
    isOnline,
    isSyncing,
    hasPendingItems,
    sync,
    checkPendingItems
  };
}; 
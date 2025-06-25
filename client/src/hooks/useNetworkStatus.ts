import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

type NetworkStatus = {
  isOnline: boolean;
};

/**
 * Hook to track the network connectivity status
 * @param showToasts Whether to show toast notifications on status change (default: false)
 * @returns The current network status (online/offline)
 */
export const useNetworkStatus = (showToasts = false): NetworkStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (showToasts) {
        toast({
          title: 'Connection Restored',
          description: 'You are back online',
          variant: 'default',
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (showToasts) {
        toast({
          title: 'Connection Lost',
          description: 'You are currently offline',
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToasts, toast]);

  return { isOnline };
};

export default useNetworkStatus; 
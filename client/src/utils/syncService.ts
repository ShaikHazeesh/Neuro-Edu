import { apiRequest } from "@/lib/queryClient";
import { getPendingSyncItems, removeSyncItem, clearPendingSyncItems } from "./localStorageUtils";

/**
 * Sync service for handling offline-to-online synchronization
 */
export class SyncService {
  private syncInProgress: boolean = false;
  private onSyncCompletedCallbacks: Array<() => void> = [];

  /**
   * Synchronize all pending items with the server
   */
  public async synchronize(): Promise<boolean> {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return false;
    }

    try {
      this.syncInProgress = true;
      const pendingItems = getPendingSyncItems();
      
      if (pendingItems.length === 0) {
        console.log('No pending items to sync');
        this.syncInProgress = false;
        return true;
      }
      
      console.log(`Found ${pendingItems.length} items to sync`);
      
      // Process items in order of timestamp (oldest first)
      const sortedItems = [...pendingItems].sort((a, b) => a.timestamp - b.timestamp);
      
      for (let i = 0; i < sortedItems.length; i++) {
        const item = sortedItems[i];
        
        try {
          if (item.type === 'video_progress' && item.progress !== undefined) {
            // Sync video progress
            await apiRequest("POST", `/api/lessons/${item.lessonId}/progress`, { 
              progress: item.progress 
            });
            console.log(`Synced video progress for lesson ${item.lessonId}: ${item.progress}%`);
          } 
          else if (item.type === 'lesson_completion') {
            // Sync lesson completion
            await apiRequest("POST", `/api/lessons/${item.lessonId}/complete`);
            console.log(`Synced lesson completion for lesson ${item.lessonId}`);
          }
          
          // Remove successfully synced item
          removeSyncItem(pendingItems.indexOf(item));
        } catch (error) {
          console.error(`Error syncing item ${item.type} for lesson ${item.lessonId}:`, error);
          // Continue with next item
        }
      }
      
      // Check if we synced everything
      const remainingItems = getPendingSyncItems();
      if (remainingItems.length === 0) {
        console.log('All items synced successfully');
        this.notifySyncCompleted();
        return true;
      } else {
        console.log(`${remainingItems.length} items failed to sync`);
        this.notifySyncCompleted();
        return false;
      }
    } catch (error) {
      console.error('Error during synchronization:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Register a callback to be called when synchronization completes
   */
  public onSyncCompleted(callback: () => void): void {
    this.onSyncCompletedCallbacks.push(callback);
  }
  
  /**
   * Notify all registered callbacks that sync has completed
   */
  private notifySyncCompleted(): void {
    this.onSyncCompletedCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in sync completed callback:', error);
      }
    });
  }
  
  /**
   * Clear all pending sync items
   */
  public clearPendingSync(): void {
    clearPendingSyncItems();
  }
}

// Export a singleton instance
export const syncService = new SyncService(); 
// Local storage keys
const STORAGE_KEYS = {
  VIDEO_PROGRESS: 'nxt_video_progress',
  LESSON_COMPLETION: 'nxt_lesson_completion',
  COURSE_PROGRESS: 'nxt_course_progress',
  USER_STREAKS: 'nxt_user_streaks',
  LAST_WATCHED_DATE: 'nxt_last_watched_date',
  PENDING_SYNC: 'nxt_pending_sync'
};

// Types for stored data
type VideoProgress = {
  [lessonId: string]: number; // lesson ID -> progress percentage (0-100)
};

type LessonCompletion = {
  [lessonId: string]: boolean; // lesson ID -> completion status
};

type CourseProgress = {
  [courseId: string]: {
    progress: number;
    completedLessons: number;
    completedModules: number[];
    quizzesPassed: number;
  };
};

type UserStreaks = {
  currentStreak: number;
  lastLoginDate: string;
  longestStreak: number;
};

// Types for sync data
type PendingSyncItem = {
  type: 'video_progress' | 'lesson_completion';
  lessonId: string;
  courseId?: string;
  progress?: number;
  moduleIndex?: number;
  timestamp: number;
};

type PendingSyncData = {
  items: PendingSyncItem[];
};

// Get video progress for a specific lesson
export const getVideoProgress = (lessonId: string): number => {
  try {
    const progressData = localStorage.getItem(STORAGE_KEYS.VIDEO_PROGRESS);
    if (!progressData) return 0;

    const progress: VideoProgress = JSON.parse(progressData);
    return progress[lessonId] || 0;
  } catch (error) {
    console.error('Error retrieving video progress from localStorage:', error);
    return 0;
  }
};

// Save video progress for a specific lesson
export const saveVideoProgress = (lessonId: string, progress: number): void => {
  try {
    const progressData = localStorage.getItem(STORAGE_KEYS.VIDEO_PROGRESS);
    const videoProgress: VideoProgress = progressData ? JSON.parse(progressData) : {};

    videoProgress[lessonId] = progress;
    localStorage.setItem(STORAGE_KEYS.VIDEO_PROGRESS, JSON.stringify(videoProgress));

    // Update last watched date for streak tracking
    localStorage.setItem(STORAGE_KEYS.LAST_WATCHED_DATE, new Date().toISOString());

    // Add to pending sync queue
    addToPendingSync({
      type: 'video_progress',
      lessonId,
      progress
    });
  } catch (error) {
    console.error('Error saving video progress to localStorage:', error);
  }
};

// Check if a lesson is completed
export const isLessonCompleted = (lessonId: string): boolean => {
  try {
    const completionData = localStorage.getItem(STORAGE_KEYS.LESSON_COMPLETION);
    if (!completionData) return false;

    const completion: LessonCompletion = JSON.parse(completionData);
    return completion[lessonId] || false;
  } catch (error) {
    console.error('Error checking lesson completion status:', error);
    return false;
  }
};

// Mark a lesson as completed
export const markLessonAsCompleted = (
  lessonId: string,
  courseId: string,
  moduleIndex: number
): void => {
  try {
    // Update lesson completion status
    const completionData = localStorage.getItem(STORAGE_KEYS.LESSON_COMPLETION);
    const lessonCompletion: LessonCompletion = completionData ? JSON.parse(completionData) : {};

    lessonCompletion[lessonId] = true;
    localStorage.setItem(STORAGE_KEYS.LESSON_COMPLETION, JSON.stringify(lessonCompletion));

    // Update course progress
    updateCourseProgress(courseId, moduleIndex);

    // Update last watched date for streak tracking
    localStorage.setItem(STORAGE_KEYS.LAST_WATCHED_DATE, new Date().toISOString());

    // Add to pending sync queue
    addToPendingSync({
      type: 'lesson_completion',
      lessonId,
      courseId,
      moduleIndex
    });
  } catch (error) {
    console.error('Error marking lesson as completed:', error);
  }
};

// Update course progress
const updateCourseProgress = (courseId: string, moduleIndex: number): void => {
  try {
    const progressData = localStorage.getItem(STORAGE_KEYS.COURSE_PROGRESS);
    const courseProgress: CourseProgress = progressData ? JSON.parse(progressData) : {};

    if (!courseProgress[courseId]) {
      courseProgress[courseId] = {
        progress: 0,
        completedLessons: 0,
        completedModules: [],
        quizzesPassed: 0
      };
    }

    // Increment completed lessons
    courseProgress[courseId].completedLessons += 1;

    // Add module to completed modules if not already there
    if (!courseProgress[courseId].completedModules.includes(moduleIndex)) {
      courseProgress[courseId].completedModules.push(moduleIndex);
    }

    // Update overall progress (simplified calculation)
    // In a real app, this would be calculated based on total lessons in the course
    courseProgress[courseId].progress = Math.min(
      100,
      courseProgress[courseId].completedLessons * 10
    );

    localStorage.setItem(STORAGE_KEYS.COURSE_PROGRESS, JSON.stringify(courseProgress));
  } catch (error) {
    console.error('Error updating course progress:', error);
  }
};

// Get course progress
export const getCourseProgress = (courseId: string): {
  progress: number;
  completedLessons: number;
  completedModules: number[];
  quizzesPassed: number;
} | null => {
  try {
    const progressData = localStorage.getItem(STORAGE_KEYS.COURSE_PROGRESS);
    if (!progressData) return null;

    const courseProgress: CourseProgress = JSON.parse(progressData);
    return courseProgress[courseId] || null;
  } catch (error) {
    console.error('Error retrieving course progress:', error);
    return null;
  }
};

// Update user streaks
export const updateUserStreaks = (): UserStreaks => {
  try {
    // Get current streaks data
    const streaksData = localStorage.getItem(STORAGE_KEYS.USER_STREAKS);
    const streaks: UserStreaks = streaksData
      ? JSON.parse(streaksData)
      : { currentStreak: 0, lastLoginDate: '', longestStreak: 0 };

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // For debugging
    console.log('Updating streak. Current data:', streaks);

    if (!streaks.lastLoginDate) {
      // First time login
      console.log('First time login, setting streak to 1');
      streaks.currentStreak = 1;
      streaks.longestStreak = 1;
    } else {
      const lastLogin = new Date(streaks.lastLoginDate);
      const lastLoginStr = lastLogin.toISOString().split('T')[0];

      if (lastLoginStr === todayStr) {
        // Already logged in today, don't update streak
        console.log('Already logged in today, keeping streak at', streaks.currentStreak);
      } else {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // For debugging
        console.log('Last login:', lastLoginStr, 'Yesterday:', yesterdayStr);

        if (lastLoginStr === yesterdayStr) {
          // Consecutive day login
          console.log('Consecutive day login, incrementing streak');
          streaks.currentStreak += 1;
          if (streaks.currentStreak > streaks.longestStreak) {
            streaks.longestStreak = streaks.currentStreak;
          }
        } else {
          // Streak broken
          console.log('Streak broken, resetting to 1');
          streaks.currentStreak = 1;
        }
      }
    }

    // Always update the last login date to today
    streaks.lastLoginDate = todayStr;

    // Make sure streak is at least 1
    if (streaks.currentStreak < 1) {
      console.log('Correcting streak from 0 to 1');
      streaks.currentStreak = 1;
    }

    // Make sure longest streak is updated
    if (streaks.currentStreak > streaks.longestStreak) {
      streaks.longestStreak = streaks.currentStreak;
    }

    // Save updated streak data
    localStorage.setItem(STORAGE_KEYS.USER_STREAKS, JSON.stringify(streaks));
    console.log('Saved updated streak data:', streaks);

    // Also update the userStreak key for compatibility with other components
    localStorage.setItem('userStreak', streaks.currentStreak.toString());

    return streaks;
  } catch (error) {
    console.error('Error updating user streaks:', error);
    return { currentStreak: 0, lastLoginDate: '', longestStreak: 0 };
  }
};

// Get user streaks
export const getUserStreaks = (): UserStreaks => {
  try {
    const streaksData = localStorage.getItem(STORAGE_KEYS.USER_STREAKS);
    if (!streaksData) {
      return { currentStreak: 0, lastLoginDate: '', longestStreak: 0 };
    }

    return JSON.parse(streaksData);
  } catch (error) {
    console.error('Error retrieving user streaks:', error);
    return { currentStreak: 0, lastLoginDate: '', longestStreak: 0 };
  }
};

// Add an item to the pending sync queue
export const addToPendingSync = (item: Omit<PendingSyncItem, 'timestamp'>): void => {
  try {
    const pendingSyncData = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    const syncData: PendingSyncData = pendingSyncData
      ? JSON.parse(pendingSyncData)
      : { items: [] };

    // Add timestamp to the item
    const syncItem: PendingSyncItem = {
      ...item,
      timestamp: Date.now()
    };

    // Add to the queue
    syncData.items.push(syncItem);

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(syncData));
  } catch (error) {
    console.error('Error adding item to pending sync:', error);
  }
};

// Get all pending sync items
export const getPendingSyncItems = (): PendingSyncItem[] => {
  try {
    const pendingSyncData = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    if (!pendingSyncData) return [];

    const syncData: PendingSyncData = JSON.parse(pendingSyncData);
    return syncData.items;
  } catch (error) {
    console.error('Error getting pending sync items:', error);
    return [];
  }
};

// Clear the pending sync queue
export const clearPendingSyncItems = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify({ items: [] }));
  } catch (error) {
    console.error('Error clearing pending sync items:', error);
  }
};

// Remove a specific sync item from the queue
export const removeSyncItem = (itemIndex: number): void => {
  try {
    const pendingSyncData = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    if (!pendingSyncData) return;

    const syncData: PendingSyncData = JSON.parse(pendingSyncData);

    if (itemIndex >= 0 && itemIndex < syncData.items.length) {
      syncData.items.splice(itemIndex, 1);
      localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(syncData));
    }
  } catch (error) {
    console.error('Error removing sync item:', error);
  }
};
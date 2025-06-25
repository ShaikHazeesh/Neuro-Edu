import React, { useMemo } from 'react';

// Generate weekly activity data from real user progress
const progressData = useMemo(() => {
  if (!userProgressData?.recentActivity) {
    // Fallback data when no activity is available
    return [
      { name: 'Mon', study: 0, mental: 0 },
      { name: 'Tue', study: 0, mental: 0 },
      { name: 'Wed', study: 0, mental: 0 },
      { name: 'Thu', study: 0, mental: 0 },
      { name: 'Fri', study: 0, mental: 0 },
      { name: 'Sat', study: 0, mental: 0 },
      { name: 'Sun', study: 0, mental: 0 },
    ];
  }
  
  // Process real data from user activity
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Create empty days for current week
  const weekData = dayNames.map(name => ({ 
    name, 
    study: 0,
    mental: 0 
  }));
  
  // Fill in data from user activity
  if (userProgressData.recentActivity && Array.isArray(userProgressData.recentActivity)) {
    // Get activity from the last 7 days
    const lastWeekActivity = userProgressData.recentActivity.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      const diffTime = today.getTime() - activityDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });
    
    // Aggregate activity by day
    lastWeekActivity.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      const dayIndex = activityDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      if (activity.type === 'lesson' || activity.type === 'quiz') {
        weekData[dayIndex].study += 10; // Count each learning activity as some minutes
      }
      
      if (activity.type === 'mood' || activity.type === 'breathing') {
        weekData[dayIndex].mental += 10; // Count each mental health activity as some minutes
      }
    });
  }
  
  // If we have mood entries, add them to mental health time
  if (userProgressData.moodEntries && Array.isArray(userProgressData.moodEntries)) {
    userProgressData.moodEntries.forEach(entry => {
      const entryDate = new Date(entry.createdAt);
      const diffTime = today.getTime() - entryDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        const dayIndex = entryDate.getDay();
        weekData[dayIndex].mental += 5; // Count each mood entry as 5 minutes
      }
    });
  }
  
  // Rearrange to start with current day
  const todayIndex = today.getDay();
  return [...weekData.slice(todayIndex + 1), ...weekData.slice(0, todayIndex + 1)];
}, [userProgressData?.recentActivity, userProgressData?.moodEntries]); 
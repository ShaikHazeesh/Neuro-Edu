import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { toast } from "sonner";

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: number; // in seconds
  category: string;
  addedBy: string;
  createdAt: string;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  category: string;
  benefits: string[];
  isExternal: boolean;
  provider?: string;
}

export interface Meditation {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  audioUrl: string;
  thumbnail: string;
  category: string;
}

export interface VideoProgress {
  userId: string;
  videoId: string;
  progress: number; // in seconds
  completed: boolean;
  lastWatched: string;
  timesWatched: number;
}

export interface StudentStats {
  userId: string;
  videosWatched: number;
  videosCompleted: number;
  totalWatchTime: number; // in seconds
  lastActive: string;
  gamesPlayed: number;
  meditationsCompleted: number;
}

interface MeditationProgress {
  userId: string;
  meditationId: string;
  completed: boolean;
  lastPracticed: string;
  totalMinutes: number;
}

interface DataContextType {
  videos: Video[];
  games: Game[];
  meditations: Meditation[];
  progress: VideoProgress[];
  stats: StudentStats | null;
  addVideo: (video: Omit<Video, 'id' | 'addedBy' | 'createdAt'>) => Promise<void>;
  updateVideoProgress: (videoId: string, progress: number, completed: boolean) => Promise<void>;
  getVideoProgress: (videoId: string) => VideoProgress | undefined;
  deleteVideo: (videoId: string) => Promise<void>;
  loadingData: boolean;
  getWatchedVideos: () => (Video & { completed: boolean; progress: number; duration: number; })[];
  completedMeditations: Meditation[];
  completedGames: Game[];
  meditationProgress: MeditationProgress[];
  updateMeditationProgress: (meditationId: string, minutes: number) => Promise<void>;
  getMeditationProgress: (meditationId: string) => MeditationProgress | null;
  addGame: (game: Omit<Game, 'id'>) => Promise<void>;
  updateGame: (gameId: string, gameData: Omit<Game, 'id'>) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
}

const MOCK_VIDEOS: Video[] = [
  {
    id: "v1",
    title: "Managing Anxiety: Breathing Techniques",
    description: "Learn simple breathing techniques to manage anxiety and stress in daily life.",
    url: "https://www.youtube.com/embed/acUZdGd_3Gk",
    thumbnail: "https://img.youtube.com/vi/acUZdGd_3Gk/hqdefault.jpg",
    duration: 300, // 5 minutes
    category: "Anxiety Management",
    addedBy: "admin-1",
    createdAt: new Date(2023, 1, 15).toISOString()
  },
  {
    id: "v2",
    title: "Understanding Depression",
    description: "A comprehensive overview of depression, its symptoms, and coping strategies.",
    url: "https://www.youtube.com/embed/2VRRx7Mtep8",
    thumbnail: "https://img.youtube.com/vi/2VRRx7Mtep8/hqdefault.jpg",
    duration: 600, // 10 minutes
    category: "Depression",
    addedBy: "admin-1",
    createdAt: new Date(2023, 2, 10).toISOString()
  },
  {
    id: "v3",
    title: "Mindfulness for Beginners",
    description: "An introduction to mindfulness practices for mental wellbeing.",
    url: "https://www.youtube.com/embed/ZToicYcHIOU",
    thumbnail: "https://img.youtube.com/vi/ZToicYcHIOU/hqdefault.jpg",
    duration: 480, // 8 minutes
    category: "Mindfulness",
    addedBy: "admin-1",
    createdAt: new Date(2023, 3, 5).toISOString()
  },
  {
    id: "v4",
    title: "Finding Your Inner Strength",
    description: "A motivational guide to discovering and harnessing your inner strength during recovery.",
    url: "https://www.youtube.com/embed/wCJ3kJRdLVw",
    thumbnail: "https://img.youtube.com/vi/wCJ3kJRdLVw/hqdefault.jpg",
    duration: 420, // 7 minutes
    category: "Motivation",
    addedBy: "admin-1",
    createdAt: new Date(2023, 4, 1).toISOString()
  },
  {
    id: "v5",
    title: "Daily Affirmations for Mental Health",
    description: "Powerful daily affirmations to boost self-esteem and maintain positive mental health.",
    url: "https://www.youtube.com/embed/6tRxZqBdAY4",
    thumbnail: "https://img.youtube.com/vi/6tRxZqBdAY4/hqdefault.jpg",
    duration: 360, // 6 minutes
    category: "Self-Care",
    addedBy: "admin-1",
    createdAt: new Date(2023, 4, 15).toISOString()
  },
  {
    id: "v6",
    title: "Building Resilience Through Adversity",
    description: "Learn how to build mental resilience and bounce back stronger from challenges.",
    url: "https://www.youtube.com/embed/1r8hj72bfGo",
    thumbnail: "https://img.youtube.com/vi/1r8hj72bfGo/hqdefault.jpg",
    duration: 540, // 9 minutes
    category: "Resilience",
    addedBy: "admin-1",
    createdAt: new Date(2023, 5, 1).toISOString()
  },
  {
    id: "v7",
    title: "The Power of Positive Thinking",
    description: "Discover how positive thinking can transform your mental health journey.",
    url: "https://www.youtube.com/embed/KM98KcGQQtE",
    thumbnail: "https://img.youtube.com/vi/KM98KcGQQtE/hqdefault.jpg",
    duration: 480, // 8 minutes
    category: "Motivation",
    addedBy: "admin-1",
    createdAt: new Date(2023, 5, 15).toISOString()
  },
  {
    id: "v8",
    title: "Overcoming Self-Doubt",
    description: "Practical strategies to overcome self-doubt and build confidence during recovery.",
    url: "https://www.youtube.com/embed/lD1OaD4FBqM",
    thumbnail: "https://img.youtube.com/vi/lD1OaD4FBqM/hqdefault.jpg",
    duration: 420, // 7 minutes
    category: "Self-Care",
    addedBy: "admin-1",
    createdAt: new Date(2023, 6, 1).toISOString()
  },
  {
    id: "v9",
    title: "Creating a Positive Daily Routine",
    description: "How to establish a healthy daily routine that supports mental recovery and growth.",
    url: "https://www.youtube.com/embed/Wf3cXTAqS2M",
    thumbnail: "https://img.youtube.com/vi/Wf3cXTAqS2M/hqdefault.jpg",
    duration: 480, // 8 minutes
    category: "Self-Care",
    addedBy: "admin-1",
    createdAt: new Date(2023, 6, 15).toISOString()
  }
];

const MOCK_GAMES: Game[] = [
  {
    id: "g1",
    title: "Color Relaxation",
    description: "A simple color matching game to help focus and relax your mind.",
    url: "https://www.mathsisfun.com/games/memory/",
    thumbnail: "https://placehold.co/600x400/9EB8D9/ffffff?text=Color+Relaxation",
    category: "Focus",
    benefits: ["Improves focus", "Relaxes the mind"],
    isExternal: true,
    provider: "Maths is Fun"
  },
  {
    id: "g2",
    title: "Puzzle Garden",
    description: "Solve peaceful puzzles in a virtual garden environment.",
    url: "https://www.jigsawplanet.com/",
    thumbnail: "https://placehold.co/600x400/A1CCA5/ffffff?text=Puzzle+Garden",
    category: "Problem Solving",
    benefits: ["Enhances problem-solving skills", "Promotes relaxation"],
    isExternal: true,
    provider: "Jigsaw Planet"
  },
  {
    id: "g3",
    title: "Peaceful Flow",
    description: "Connect dots to create flowing patterns and promote calm focus.",
    url: "https://www.coolmathgames.com/0-flow-free",
    thumbnail: "https://placehold.co/600x400/F9C6BA/333333?text=Peaceful+Flow",
    category: "Creativity",
    benefits: ["Fosters creativity", "Improves focus"],
    isExternal: true,
    provider: "Cool Math Games"
  }
];

const MOCK_MEDITATIONS: Meditation[] = [
  {
    id: "m1",
    title: "5-Minute Breathing Meditation",
    description: "A quick breathing exercise to center yourself during a busy day.",
    duration: 5,
    audioUrl: "/meditations/breathing-meditation.mp3",
    thumbnail: "/images/meditations/breathing.jpg",
    category: "Breathing"
  },
  {
    id: "m2",
    title: "Body Scan Relaxation",
    description: "A guided meditation to release tension throughout your body.",
    duration: 10,
    audioUrl: "/meditations/body-scan.mp3",
    thumbnail: "/images/meditations/body-scan.jpg",
    category: "Relaxation"
  },
  {
    id: "m3",
    title: "Loving-Kindness Practice",
    description: "Develop compassion for yourself and others with this gentle meditation.",
    duration: 15,
    audioUrl: "/meditations/loving-kindness.mp3",
    thumbnail: "/images/meditations/loving-kindness.jpg",
    category: "Compassion"
  }
];

const MOCK_PROGRESS: VideoProgress[] = [];

const MOCK_STATS: StudentStats = {
  userId: "student-1",
  videosWatched: 0,
  videosCompleted: 0,
  totalWatchTime: 0,
  lastActive: new Date().toISOString(),
  gamesPlayed: 0,
  meditationsCompleted: 0
};

const MOCK_MEDITATION_PROGRESS: MeditationProgress[] = [];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  
  // State
  const [videos, setVideos] = useState<Video[]>(MOCK_VIDEOS);
  const [games, setGames] = useState<Game[]>(MOCK_GAMES);
  const [meditations, setMeditations] = useState<Meditation[]>(MOCK_MEDITATIONS);
  const [progress, setProgress] = useState<VideoProgress[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [meditationProgress, setMeditationProgress] = useState<MeditationProgress[]>([]);
  const [completedMeditations, setCompletedMeditations] = useState<Meditation[]>([]);
  const [completedGames, setCompletedGames] = useState<Game[]>([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        // Load videos from localStorage or use mock data
        const storedVideos = localStorage.getItem('videos');
        if (storedVideos) {
          setVideos(JSON.parse(storedVideos));
        } else {
          localStorage.setItem('videos', JSON.stringify(MOCK_VIDEOS));
        }

        // Load games from localStorage or use mock data
        const storedGames = localStorage.getItem('games');
        if (storedGames) {
          setGames(JSON.parse(storedGames));
        } else {
          localStorage.setItem('games', JSON.stringify(MOCK_GAMES));
        }

        if (user) {
          // Load user progress
          const storedProgress = localStorage.getItem(`progress_${user.id}`);
          if (storedProgress) {
            setProgress(JSON.parse(storedProgress));
          }

          // Load user stats
          const storedStats = localStorage.getItem(`stats_${user.id}`);
          if (storedStats) {
            setStats(JSON.parse(storedStats));
          } else {
            setStats(MOCK_STATS);
            localStorage.setItem(`stats_${user.id}`, JSON.stringify(MOCK_STATS));
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load some data');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (user) {
      const storedProgress = localStorage.getItem(`meditation_progress_${user.id}`);
      if (storedProgress) {
        setMeditationProgress(JSON.parse(storedProgress));
      }
    }
  }, [user]);

  const addVideo = async (videoData: Omit<Video, 'id' | 'addedBy' | 'createdAt'>) => {
    if (!user || user.role !== 'admin') {
      toast.error("Only administrators can add videos");
      throw new Error("Unauthorized");
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const newVideo: Video = {
        ...videoData,
        id: `v${videos.length + 1}`,
        addedBy: user.id,
        createdAt: new Date().toISOString()
      };

      setVideos(prev => [...prev, newVideo]);
      toast.success("Video added successfully");
    } catch (error) {
      console.error("Failed to add video:", error);
      toast.error("Failed to add video");
      throw error;
    }
  };

  const updateVideoProgress = async (videoId: string, currentProgress: number, completed: boolean) => {
    if (!user || user.role !== 'student') {
      toast.error("Only students can track progress");
      throw new Error("Unauthorized");
    }

    try {
      setLoadingData(true);
      
      await new Promise(resolve => setTimeout(resolve, 300));

      const now = new Date().toISOString();
      const existingProgressIndex = progress.findIndex(p => p.userId === user.id && p.videoId === videoId);
      
      let updatedProgress = [...progress];
      let updatedStats = stats ? {...stats} : null;
      
      if (existingProgressIndex >= 0) {
        const existingItem = progress[existingProgressIndex];
        updatedProgress[existingProgressIndex] = {
          ...existingItem,
          progress: currentProgress,
          completed: completed || existingItem.completed,
          lastWatched: now,
          timesWatched: existingItem.timesWatched + (completed && !existingItem.completed ? 1 : 0)
        };
      } else {
        updatedProgress.push({
          userId: user.id,
          videoId,
          progress: currentProgress,
          completed,
          lastWatched: now,
          timesWatched: completed ? 1 : 0
        });
        
        if (updatedStats) {
          updatedStats.videosWatched++;
        }
      }
      
      if (updatedStats) {
        updatedStats.lastActive = now;
        
        if (completed) {
          const wasCompletedBefore = existingProgressIndex >= 0 && progress[existingProgressIndex].completed;
          
          if (!wasCompletedBefore) {
            updatedStats.videosCompleted++;
          }
        }
        
        const video = videos.find(v => v.id === videoId);
        if (video) {
          updatedStats.totalWatchTime += currentProgress;
        }
      }
      
      setProgress(updatedProgress);
      if (updatedStats) setStats(updatedStats);
      
      localStorage.setItem(`progress_${user.id}`, JSON.stringify(updatedProgress));
      if (updatedStats) localStorage.setItem(`stats_${user.id}`, JSON.stringify(updatedStats));
      
    } catch (error) {
      console.error("Failed to update progress:", error);
      toast.error("Failed to save your progress");
      throw error;
    } finally {
      setLoadingData(false);
    }
  };

  const getVideoProgress = (videoId: string) => {
    if (!user) return undefined;
    return progress.find(p => p.userId === user.id && p.videoId === videoId);
  };

  const deleteVideo = async (videoId: string) => {
    if (!user || user.role !== 'admin') {
      toast.error("Only administrators can delete videos");
      throw new Error("Unauthorized");
    }

    try {
      setLoadingData(true);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Remove video from videos array
      const updatedVideos = videos.filter(video => video.id !== videoId);
      setVideos(updatedVideos);

      // Remove all progress entries related to this video
      const updatedProgress = progress.filter(p => p.videoId !== videoId);
      setProgress(updatedProgress);

      // Update stats for all users who had progress on this video
      const affectedUserIds = new Set(progress.filter(p => p.videoId === videoId).map(p => p.userId));
      
      affectedUserIds.forEach(userId => {
        const userStats = JSON.parse(localStorage.getItem(`stats_${userId}`) || '{}');
        if (userStats) {
          const userProgress = progress.find(p => p.userId === userId && p.videoId === videoId);
          if (userProgress?.completed) {
            userStats.videosCompleted = Math.max(0, (userStats.videosCompleted || 0) - 1);
          }
          userStats.videosWatched = Math.max(0, (userStats.videosWatched || 0) - 1);
          localStorage.setItem(`stats_${userId}`, JSON.stringify(userStats));
        }
      });

      // Persist the updated videos list
      localStorage.setItem('videos', JSON.stringify(updatedVideos));

      // Update progress in localStorage for all users
      const allUserIds = new Set(progress.map(p => p.userId));
      allUserIds.forEach(userId => {
        const userProgress = updatedProgress.filter(p => p.userId === userId);
        localStorage.setItem(`progress_${userId}`, JSON.stringify(userProgress));
      });

      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Failed to delete video:", error);
      toast.error("Failed to delete video");
      throw error;
    } finally {
      setLoadingData(false);
    }
  };

  const getWatchedVideos = () => {
    if (!user) return [];
    
    const userProgress = progress.filter(p => p.userId === user.id);
    return userProgress.map(p => {
      const video = videos.find(v => v.id === p.videoId);
      if (!video) return null;
      return {
        ...video,
        completed: p.completed,
        progress: p.progress
      };
    }).filter(Boolean) as (Video & { completed: boolean; progress: number; duration: number; })[];
  };

  const updateMeditationProgress = async (meditationId: string, minutes: number) => {
    if (!user) return;

    try {
      setLoadingData(true);
      
      const now = new Date().toISOString();
      const existingProgress = meditationProgress.find(
        p => p.userId === user.id && p.meditationId === meditationId
      );

      let updatedProgress;
      if (existingProgress) {
        updatedProgress = meditationProgress.map(p =>
          p.userId === user.id && p.meditationId === meditationId
            ? {
                ...p,
                completed: true,
                lastPracticed: now,
                totalMinutes: p.totalMinutes + minutes
              }
            : p
        );
      } else {
        updatedProgress = [
          ...meditationProgress,
          {
            userId: user.id,
            meditationId,
            completed: true,
            lastPracticed: now,
            totalMinutes: minutes
          }
        ];
      }

      setMeditationProgress(updatedProgress);
      localStorage.setItem(`meditation_progress_${user.id}`, JSON.stringify(updatedProgress));

      // Update user stats
      if (stats) {
        const updatedStats = {
          ...stats,
          meditationsCompleted: stats.meditationsCompleted + 1
        };
        setStats(updatedStats);
        localStorage.setItem(`stats_${user.id}`, JSON.stringify(updatedStats));
      }

      toast.success("Meditation progress saved");
    } catch (error) {
      console.error("Failed to update meditation progress:", error);
      toast.error("Failed to save meditation progress");
    } finally {
      setLoadingData(false);
    }
  };

  const getMeditationProgress = (meditationId: string) => {
    if (!user) return null;
    return meditationProgress.find(
      p => p.userId === user.id && p.meditationId === meditationId
    );
  };

  const addGame = async (gameData: Omit<Game, 'id'>) => {
    if (!user || user.role !== 'admin') {
      toast.error("Only administrators can add games");
      throw new Error("Unauthorized");
    }

    try {
      setLoadingData(true);
      await new Promise(resolve => setTimeout(resolve, 600));

      const newGame: Game = {
        ...gameData,
        id: `g${games.length + 1}`
      };

      const updatedGames = [...games, newGame];
      setGames(updatedGames);
      localStorage.setItem('games', JSON.stringify(updatedGames));
      toast.success("Game added successfully");
    } catch (error) {
      console.error("Failed to add game:", error);
      toast.error("Failed to add game");
      throw error;
    } finally {
      setLoadingData(false);
    }
  };

  const updateGame = async (gameId: string, gameData: Omit<Game, 'id'>) => {
    if (!user || user.role !== 'admin') {
      toast.error("Only administrators can update games");
      throw new Error("Unauthorized");
    }

    try {
      setLoadingData(true);
      await new Promise(resolve => setTimeout(resolve, 600));

      const updatedGames = games.map(game =>
        game.id === gameId ? { ...gameData, id: gameId } : game
      );

      setGames(updatedGames);
      localStorage.setItem('games', JSON.stringify(updatedGames));
      toast.success("Game updated successfully");
    } catch (error) {
      console.error("Failed to update game:", error);
      toast.error("Failed to update game");
      throw error;
    } finally {
      setLoadingData(false);
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!user || user.role !== 'admin') {
      toast.error("Only administrators can delete games");
      throw new Error("Unauthorized");
    }

    try {
      setLoadingData(true);
      await new Promise(resolve => setTimeout(resolve, 600));

      const updatedGames = games.filter(game => game.id !== gameId);
      setGames(updatedGames);
      localStorage.setItem('games', JSON.stringify(updatedGames));
      toast.success("Game deleted successfully");
    } catch (error) {
      console.error("Failed to delete game:", error);
      toast.error("Failed to delete game");
      throw error;
    } finally {
      setLoadingData(false);
    }
  };

  const value = {
    videos,
    games,
    meditations,
    progress,
    stats,
    addVideo,
    updateVideoProgress,
    getVideoProgress,
    deleteVideo,
    loadingData,
    getWatchedVideos,
    completedMeditations,
    completedGames,
    meditationProgress,
    updateMeditationProgress,
    getMeditationProgress,
    addGame,
    updateGame,
    deleteGame,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

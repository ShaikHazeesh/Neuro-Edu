
import { toast } from "sonner";

// This file serves as a placeholder for future Supabase integration
// It provides a structure for API calls that can be easily migrated to Supabase

// Types
interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

// Generic error handler function
const handleError = (error: any, message: string = "An error occurred") => {
  console.error(error);
  toast.error(message);
  return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
};

// Generic success handler function
const handleSuccess = <T>(data: T, message?: string): ApiResponse<T> => {
  if (message) {
    toast.success(message);
  }
  return { data, error: null };
};

// Auth service functions
export const authService = {
  login: async (email: string, password: string): Promise<ApiResponse<any>> => {
    try {
      // This will be replaced with Supabase auth
      console.log('Login attempt with:', email);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, this is handled in AuthContext with mock data
      return handleSuccess({}, "Logged in successfully");
    } catch (error) {
      return handleError(error, "Login failed");
    }
  },
  
  logout: async (): Promise<ApiResponse<null>> => {
    try {
      // This will be replaced with Supabase auth
      console.log('Logout attempt');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return handleSuccess(null, "Logged out successfully");
    } catch (error) {
      return handleError(error, "Logout failed");
    }
  },
  
  getCurrentUser: async (): Promise<ApiResponse<any>> => {
    try {
      // This will be replaced with Supabase auth
      console.log('Getting current user');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For now, get from localStorage
      const storedUser = localStorage.getItem('eduPortalUser');
      if (!storedUser) {
        throw new Error("No user found");
      }
      
      return handleSuccess(JSON.parse(storedUser));
    } catch (error) {
      return handleError(error, "Failed to get current user");
    }
  }
};

// Data service functions - will be connected to Supabase tables later
export const dataService = {
  getVideos: async (): Promise<ApiResponse<any[]>> => {
    try {
      console.log('Fetching videos');
      // This would fetch from Supabase
      // For now, it's handled in DataContext with mock data
      return handleSuccess([]);
    } catch (error) {
      return handleError(error, "Failed to fetch videos");
    }
  },
  
  saveVideoProgress: async (videoId: string, progress: number, completed: boolean): Promise<ApiResponse<any>> => {
    try {
      console.log(`Saving progress for video ${videoId}:`, { progress, completed });
      // This would save to Supabase
      // For now, it's handled in DataContext with localStorage
      return handleSuccess({}, completed ? "Video completed!" : undefined);
    } catch (error) {
      return handleError(error, "Failed to save video progress");
    }
  }
};

export default {
  auth: authService,
  data: dataService
};

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import MainLayout from "@/components/layout/MainLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Videos from "./pages/Videos";
import VideoDetail from "./pages/VideoDetail";
import Games from "./pages/Games";
import Meditations from "./pages/Meditations";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVideos from "./pages/admin/AdminVideos";
import VideoForm from "./pages/admin/VideoForm";
import AdminChatbot from "./pages/admin/AdminChatbot";
import NotFound from "./pages/NotFound";
import AdminGames from "./pages/admin/AdminGames";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DataProvider>
            <ThemeProvider defaultTheme="light" storageKey="app-theme">
              <BrowserRouter>
                <Routes>
                  {/* Auth routes */}
                  <Route path="/login" element={<Login />} />
                  
                  {/* Main app routes with layout */}
                  <Route element={<MainLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/videos" element={<Videos />} />
                    <Route path="/videos/:videoId" element={<VideoDetail />} />
                    <Route path="/games" element={<Games />} />
                    <Route path="/meditations" element={<Meditations />} />
                    
                    {/* Admin routes */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/videos" element={<AdminVideos />} />
                    <Route path="/admin/videos/add" element={<VideoForm />} />
                    <Route path="/admin/videos/edit/:videoId" element={<VideoForm />} />
                    <Route path="/admin/chatbot" element={<AdminChatbot />} />
                    <Route path="/admin/games" element={<AdminGames />} />
                    <Route path="/admin/meditations" element={<NotFound />} />
                    <Route path="/admin/settings" element={<NotFound />} />
                  </Route>
                  
                  {/* Catch-all route for 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </BrowserRouter>
            </ThemeProvider>
          </DataProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

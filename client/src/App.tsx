import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CourseDetail from "@/pages/course-detail";
import Courses from "@/pages/courses";
import MentalHealth from "@/pages/mental-health";
import CheatSheets from "@/pages/cheat-sheets";
import Community from "@/pages/community";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import Profile from "@/pages/profile";
import { MessageSquare, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FloatingChatBot from "./components/shared/FloatingChatBot";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/profile" component={Profile} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/mental-health" component={MentalHealth} />
      <Route path="/cheat-sheets" component={CheatSheets} />
      <ProtectedRoute path="/community" component={Community} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
        
        {/* Floating Chat Icon */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all z-50"
          aria-label="Open chat assistant"
        >
          <MessageSquare size={24} />
        </button>

        {/* Chat Modal */}
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogContent className="max-w-md h-[550px] p-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle>AI Assistant</DialogTitle>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={18} />
                </button>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <FloatingChatBot />
            </div>
          </DialogContent>
        </Dialog>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

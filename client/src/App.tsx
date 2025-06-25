import { useState, useEffect, useRef } from "react";
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
import QuizPage from "@/pages/quiz-page";
import CodeChallengesPage from "@/pages/CodeChallengesPage";
import CodeChallengePage from "@/pages/CodeChallengePage";
import ChatbotPage from "@/pages/chatbot";
import { MessageSquare } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import FloatingChatBot from "./components/shared/FloatingChatBot";
import LeftSideChatBot from "./components/shared/LeftSideChatBot";
import React from "react";
import StreakProvider from "./context/streak-context";
import { EyeTrackingProvider } from "./context/eye-tracking-context";
import { NotificationProvider } from "./context/notification-context";
import { CameraProvider } from "./context/camera-context";

// Import the mental health subpages
import MoodJournal from "@/pages/mental-health/journal";
import BreathingExercise from "@/pages/mental-health/breathing";

// Import the debug page
import DebugPage from "@/pages/debug";

// Custom DialogContent without the close button
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
CustomDialogContent.displayName = "CustomDialogContent";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/profile" component={Profile} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetail} />
      <ProtectedRoute path="/quiz/:id" component={QuizPage} />
      <Route path="/mental-health" component={MentalHealth} />
      <Route path="/mental-health/journal" component={MoodJournal} />
      <Route path="/mental-health/breathing" component={BreathingExercise} />
      <Route path="/cheat-sheets" component={CheatSheets} />
      <ProtectedRoute path="/community" component={Community} />
      <Route path="/chatbot" component={ChatbotPage} />
      <ProtectedRoute path="/code-challenges" component={() => <CodeChallengesPage />} />
      <ProtectedRoute path="/code-challenges/:id" component={() => <CodeChallengePage />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <StreakProvider>
        <NotificationProvider>
          <CameraProvider>
            <EyeTrackingProvider>
              <AuthProvider>
                <div className="w-full h-full flex flex-col">
                  <Toaster />

                  {/* Fixed button to load face models */}
                  <div className="fixed bottom-4 right-4 z-50">
                    <button
                      onClick={() => window.open('/load-models.html', '_blank')}
                      className="bg-primary text-white px-4 py-2 rounded-md shadow-md hover:bg-primary/90 text-sm"
                    >
                      Load Face Models
                    </button>
                  </div>
                  <Switch>
                    <Route path="/" component={Home} />
                    <Route path="/auth" component={AuthPage} />
                    <ProtectedRoute path="/dashboard" component={Dashboard} />
                    <ProtectedRoute path="/profile" component={Profile} />
                    <Route path="/courses" component={Courses} />
                    <Route path="/courses/:id" component={CourseDetail} />
                    <ProtectedRoute path="/quiz/:id" component={QuizPage} />
                    <Route path="/mental-health" component={MentalHealth} />
                    <Route path="/mental-health/journal" component={MoodJournal} />
                    <Route path="/mental-health/breathing" component={BreathingExercise} />
                    <Route path="/cheat-sheets" component={CheatSheets} />
                    <ProtectedRoute path="/community" component={Community} />
                    <Route path="/chatbot" component={ChatbotPage} />
                    <ProtectedRoute path="/code-challenges" component={() => <CodeChallengesPage />} />
                    <ProtectedRoute path="/code-challenges/:id" component={() => <CodeChallengePage />} />
                    <ProtectedRoute path="/debug" component={() => <DebugPage />} />
                    <Route component={NotFound} />
                  </Switch>
                  <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                    <DialogPortal>
                      <DialogOverlay className={cn("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", isFullScreen && "!bg-white dark:!bg-black")} />
                      <DialogPrimitive.Content className={cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg", isFullScreen && "h-full w-full !max-w-full sm:!rounded-none")}>
                        <div className="flex flex-col h-full">
                          <DialogHeader className="border-b border-border p-4 pb-2">
                            <div className="flex items-center justify-between">
                              <DialogTitle className="flex items-center">
                                <MessageSquare className="mr-2" />
                                Chat Assistant
                              </DialogTitle>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                {/* {!isFullScreen && (
                                  <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(true)}>
                                    <Maximize2 size={20} />
                                  </Button>
                                )} */}
                                {/* {isFullScreen && (
                                  <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(false)}>
                                    <Minimize2 size={20} />
                                  </Button>
                                )} */}
                              </div>
                            </div>
                          </DialogHeader>
                          <div className="flex-1 overflow-auto">
                            <FloatingChatBot fullScreen={isFullScreen} />
                          </div>
                        </div>
                      </DialogPrimitive.Content>
                    </DialogPortal>
                  </Dialog>
                </div>
              </AuthProvider>
            </EyeTrackingProvider>
          </CameraProvider>
        </NotificationProvider>
      </StreakProvider>
    </QueryClientProvider>
  );
}

export default App;

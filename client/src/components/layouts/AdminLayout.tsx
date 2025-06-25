import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [, navigate] = useLocation();
  const { user, logoutMutation, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if user is admin, if not redirect to login
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/admin/login");
    } else if (!isLoading && user && !user.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/admin/login");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-icons">menu</span>
            </Button>
            <div 
              className="font-bold text-xl text-primary cursor-pointer"
              onClick={() => navigate("/admin/dashboard")}
            >
              Admin Dashboard
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden md:inline text-sm text-gray-600 dark:text-gray-300">
              Logged in as Admin
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/admin-avatar.png" alt="Admin" />
                    <AvatarFallback className="bg-primary text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                  <span className="material-icons text-sm mr-2">dashboard</span>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/students")}>
                  <span className="material-icons text-sm mr-2">people</span>
                  Students
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/progress")}>
                  <span className="material-icons text-sm mr-2">insights</span>
                  Progress Tracking
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/mood")}>
                  <span className="material-icons text-sm mr-2">mood</span>
                  Mood Analytics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <span className="material-icons text-sm mr-2">home</span>
                  Student View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <span className="material-icons text-sm mr-2">logout</span>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-2">
            <nav className="flex flex-col space-y-2">
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  navigate("/admin/dashboard");
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="material-icons text-sm mr-2">dashboard</span>
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  navigate("/admin/students");
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="material-icons text-sm mr-2">people</span>
                Students
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  navigate("/admin/progress");
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="material-icons text-sm mr-2">insights</span>
                Progress Tracking
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  navigate("/admin/mood");
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="material-icons text-sm mr-2">mood</span>
                Mood Analytics
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  navigate("/dashboard");
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="material-icons text-sm mr-2">home</span>
                Student View
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-red-500"
                onClick={handleLogout}
              >
                <span className="material-icons text-sm mr-2">logout</span>
                Log out
              </Button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar - Desktop only */}
        <aside className="hidden md:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <nav className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate("/admin/dashboard")}
              >
                <span className="material-icons text-sm mr-2">dashboard</span>
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate("/admin/students")}
              >
                <span className="material-icons text-sm mr-2">people</span>
                Students
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate("/admin/progress")}
              >
                <span className="material-icons text-sm mr-2">insights</span>
                Progress Tracking
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate("/admin/mood")}
              >
                <span className="material-icons text-sm mr-2">mood</span>
                Mood Analytics
              </Button>
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/dashboard")}
                >
                  <span className="material-icons text-sm mr-2">home</span>
                  Student View
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-500"
                  onClick={handleLogout}
                >
                  <span className="material-icons text-sm mr-2">logout</span>
                  Log out
                </Button>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../hooks/use-auth";
import {
  LayoutDashboard,
  Book,
  Heart,
  FileText,
  Users,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  User,
  Code,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationBell from "@/components/shared/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useDarkMode } from "../../hooks/useDarkMode";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const initials = user?.fullName
    ? `${user.fullName.split(' ')[0][0]}${user.fullName.split(' ')[1]?.[0] || ''}`
    : user?.username?.substring(0, 2).toUpperCase() || 'U';

  const routes = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      protected: true
    },
    {
      name: "Courses",
      path: "/courses",
      icon: <Book className="h-5 w-5" />,
      protected: false
    },
    {
      name: "Code Playground",
      path: "/code-challenges",
      icon: <Code className="h-5 w-5" />,
      protected: true
    },
    {
      name: "Mental Health",
      path: "/mental-health",
      icon: <Heart className="h-5 w-5" />,
      protected: false
    },
    {
      name: "Cheat Sheets",
      path: "/cheat-sheets",
      icon: <FileText className="h-5 w-5" />,
      protected: false
    },
    {
      name: "Community",
      path: "/community",
      icon: <Users className="h-5 w-5" />,
      protected: true
    },
    {
      name: "Summarizer",
      path: "https://karetextsummarizer.streamlit.app",
      icon: <FileText className="h-5 w-5" />,
      protected: false,
      external: true
    },
    {
      name: "Chatbot",
      path: "/chatbot",
      icon: <MessageSquare className="h-5 w-5" />,
      protected: false
    }
  ];

  const filteredRoutes = user
    ? routes
    : routes.filter(route => !route.protected);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">Neuro Edu</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 md:space-x-4 lg:space-x-6">
            {filteredRoutes.map((route) => (
              route.external ? (
                <a
                  key={route.path}
                  href={route.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm font-medium flex items-center space-x-1 transition-colors hover:text-primary text-muted-foreground`}
                >
                  {route.icon}
                  <span>{route.name}</span>
                </a>
              ) : (
                <Link
                  key={route.path}
                  href={route.path}
                  className={`text-sm font-medium flex items-center space-x-1 transition-colors hover:text-primary ${
                    location === route.path ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {route.icon}
                  <span>{route.name}</span>
                </Link>
              )
            ))}
          </nav>

          <div className="flex-1 flex justify-end items-center space-x-4">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                    aria-label="Open user menu"
                  >
                    <Avatar>
                      <AvatarImage src={user.avatarUrl || ""} alt={user.username} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.fullName || user.username}</p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer w-full flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default">
                <Link href="/auth">Login</Link>
              </Button>
            )}

            {/* Mobile Navigation Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0">
                <div className="px-2 py-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <Link
                      href="/"
                      className="flex items-center space-x-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="font-bold text-lg">Neuro Edu</span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <nav className="flex flex-col space-y-4">
                    {filteredRoutes.map((route) => (
                      route.external ? (
                        <a
                          key={route.path}
                          href={route.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-2 py-2 rounded-md transition-colors hover:bg-accent text-foreground"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {route.icon}
                          <span>{route.name}</span>
                        </a>
                      ) : (
                        <Link
                          key={route.path}
                          href={route.path}
                          className={`flex items-center space-x-2 px-2 py-2 rounded-md transition-colors ${
                            location === route.path
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-accent text-foreground"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {route.icon}
                          <span>{route.name}</span>
                        </Link>
                      )
                    ))}
                  </nav>

                  <Separator className="my-6" />

                  {user ? (
                    <div className="mt-auto space-y-4">
                      <div className="flex items-center space-x-3 px-2">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl || ""} alt={user.username} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.fullName || user.username}</p>
                          {user.email && (
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          )}
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center space-x-2 px-2 py-2 rounded-md transition-colors hover:bg-accent w-full"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full flex items-center space-x-2 justify-start"
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Log out</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-auto">
                      <Button
                        className="w-full"
                        asChild
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Link href="/auth">Login</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="flex flex-col items-center md:items-start gap-2 md:gap-1">
            <p className="text-sm text-muted-foreground">
              © 2025 Neuro Edu. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-4">
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
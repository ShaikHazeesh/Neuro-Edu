
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Video, Gamepad2, Heart, Home, BarChart, Book, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen?: boolean;
}

const Sidebar = ({ isOpen = true }: SidebarProps) => {
  const { isAdmin } = useAuth();
  
  return (
    <aside className={`${isOpen ? 'hidden md:block w-64' : 'hidden'} border-r border-wellness-light-blue/30 bg-white/60 backdrop-blur-sm`}>
      <div className="h-full overflow-y-auto py-6 px-3">
        <nav className="space-y-1">
          {/* Admin links */}
          {isAdmin && (
            <>
              <NavLink
                to="/"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 transition-all",
                  isActive 
                    ? "bg-wellness-blue/10 text-wellness-blue font-medium" 
                    : "hover:bg-wellness-light-blue/20"
                )}
              >
                <BarChart className="w-5 h-5" />
                <span>Admin Dashboard</span>
              </NavLink>
              
              <NavLink
                to="/admin/videos"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 transition-all",
                  isActive 
                    ? "bg-wellness-blue/10 text-wellness-blue font-medium" 
                    : "hover:bg-wellness-light-blue/20"
                )}
              >
                <Video className="w-5 h-5" />
                <span>Manage Videos</span>
              </NavLink>
              
              <NavLink
                to="/admin/games"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 transition-all",
                  isActive 
                    ? "bg-wellness-blue/10 text-wellness-blue font-medium" 
                    : "hover:bg-wellness-light-blue/20"
                )}
              >
                <Gamepad2 className="w-5 h-5" />
                <span>Manage Games</span>
              </NavLink>
              
              <NavLink
                to="/admin/meditations"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 transition-all",
                  isActive 
                    ? "bg-wellness-blue/10 text-wellness-blue font-medium" 
                    : "hover:bg-wellness-light-blue/20"
                )}
              >
                <Heart className="w-5 h-5" />
                <span>Manage Meditations</span>
              </NavLink>
              
              <NavLink
                to="/admin/settings"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 transition-all",
                  isActive 
                    ? "bg-wellness-blue/10 text-wellness-blue font-medium" 
                    : "hover:bg-wellness-light-blue/20"
                )}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </NavLink>
            </>
          )}
          
          {/* Student links - only show if not admin */}
          {!isAdmin && (
            <>
              <NavLink
                to="/"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 transition-all",
                  isActive 
                    ? "bg-wellness-blue/10 text-wellness-blue font-medium" 
                    : "hover:bg-wellness-light-blue/20"
                )}
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </NavLink>
              
              <NavLink
                to="/videos"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 transition-all",
                  isActive 
                    ? "bg-wellness-blue/10 text-wellness-blue font-medium" 
                    : "hover:bg-wellness-light-blue/20"
                )}
              >
                <Video className="w-5 h-5" />
                <span>Videos</span>
              </NavLink>
              
              <NavLink
                to="/games"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 transition-all",
                  isActive 
                    ? "bg-wellness-blue/10 text-wellness-blue font-medium" 
                    : "hover:bg-wellness-light-blue/20"
                )}
              >
                <Gamepad2 className="w-5 h-5" />
                <span>Games</span>
              </NavLink>
              
              <NavLink
                to="/meditations"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 transition-all",
                  isActive 
                    ? "bg-wellness-blue/10 text-wellness-blue font-medium" 
                    : "hover:bg-wellness-light-blue/20"
                )}
              >
                <Heart className="w-5 h-5" />
                <span>Meditations</span>
              </NavLink>
              
              <NavLink
                to="/resources"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 transition-all",
                  isActive 
                    ? "bg-wellness-blue/10 text-wellness-blue font-medium" 
                    : "hover:bg-wellness-light-blue/20"
                )}
              >
                <Book className="w-5 h-5" />
                <span>Resources</span>
              </NavLink>
            </>
          )}
        </nav>
        
        {/* User stats at bottom - only show for students */}
        {!isAdmin && (
          <div className="mt-8 pt-6 border-t border-wellness-light-blue/30">
            <div className="px-4">
              <div className="text-xs uppercase font-semibold text-gray-500 mb-2">Your Progress</div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Videos Watched</span>
                  <span className="text-sm font-medium">3/12</span>
                </div>
                
                <div className="w-full bg-wellness-light-blue/30 rounded-full h-1.5">
                  <div className="bg-wellness-blue h-1.5 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

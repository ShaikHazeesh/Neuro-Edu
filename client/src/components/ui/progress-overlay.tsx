import React from 'react';
import { cn } from "@/lib/utils";

interface ProgressOverlayProps {
  progress: number;
  className?: string;
  color?: string;
  direction?: 'horizontal' | 'vertical';
  children: React.ReactNode;
}

/**
 * A component that displays a progress overlay on top of any content
 */
const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
  progress,
  className,
  color = "bg-primary-foreground/20",
  direction = 'horizontal',
  children
}) => {
  // Ensure progress is within 0-100 range
  const safeProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Progress bar overlay */}
      <div 
        className={`absolute ${color}`}
        style={
          direction === 'horizontal' 
            ? { 
                left: 0, 
                top: 0, 
                bottom: 0, 
                width: `${safeProgress}%`,
                transition: 'width 0.3s ease-in-out' 
              } 
            : { 
                left: 0, 
                right: 0, 
                bottom: 0, 
                height: `${safeProgress}%`,
                transition: 'height 0.3s ease-in-out' 
              }
        }
      />
      
      {/* Content on top of the progress bar */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export { ProgressOverlay }; 
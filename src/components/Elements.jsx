import React from 'react';
import { cn } from '../utils/cn';

export const SkeletonLoader = ({ className, delay = 0 }) => {
  return (
    <div 
      className={cn(
        "bg-white/5 rounded-xl relative overflow-hidden",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};

export const AlertBanner = ({ message, type = 'danger', className }) => {
  const isDanger = type === 'danger';
  
  return (
    <div className={cn(
      "glass-panel p-4 flex items-center gap-4 rounded-[16px]",
      isDanger ? "border-red-500/20 bg-red-500/5 glow-red" : "border-amber-500/20 bg-amber-500/5 glow-amber",
      className
    )}>
      <div className="relative flex h-3 w-3">
        <span className={cn(
          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
          isDanger ? "bg-red-400" : "bg-amber-400"
        )}></span>
        <span className={cn(
          "relative inline-flex rounded-full h-3 w-3",
          isDanger ? "bg-red-500" : "bg-amber-500"
        )}></span>
      </div>
      <p className={cn(
        "font-inter text-sm font-medium",
        isDanger ? "text-red-200" : "text-amber-200"
      )}>
        {message}
      </p>
    </div>
  );
};

import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, KanbanSquare, LineChart, Users, Menu, X, Activity } from 'lucide-react';
import { cn } from '../utils/cn';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/kanban', label: 'Kanban Board', icon: KanbanSquare },
  { path: '/analytics', label: 'Analytics', icon: LineChart },
  { path: '/team', label: 'Team', icon: Users },
];

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 glass-panel border-y-0 border-l-0 rounded-none rounded-r-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo Area */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity className="w-8 h-8 text-smartops-primary" />
              <div className="absolute inset-0 bg-smartops-primary blur-md opacity-40 mix-blend-screen" />
            </div>
            <span className="font-space font-bold text-xl tracking-wide text-white">SmartOps</span>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "text-smartops-primary bg-smartops-primary/10 glow-active border border-smartops-primary/20" 
                  : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5 relative z-10" />
              <span className="font-medium relative z-10">{item.label}</span>
              {/* Hover glow effect for non-active states */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-smartops-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </NavLink>
          ))}
        </nav>
        
        {/* Bottom User Area or Version */}
        <div className="p-6 border-t border-smartops-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-smartops-primary/20 to-smartops-primary rounded-xl flex items-center justify-center font-space font-bold text-sm text-smartops-bg shadow-[0_0_15px_rgba(0,229,204,0.3)]">
              OP
            </div>
            <div>
              <p className="text-sm font-medium text-white">Ops Admin</p>
              <p className="text-xs text-gray-500">v1.0.4 - Canary</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

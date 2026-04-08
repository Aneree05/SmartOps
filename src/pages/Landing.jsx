import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Lock } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -30, transition: { duration: 0.4 } }
};

export default function Landing() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <motion.div 
      className="min-h-screen w-full relative overflow-hidden flex items-center justify-center bg-smartops-bg"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Hand-coded Animated Grid Pattern Background */}
      <div className="absolute inset-0 z-0 opacity-20 bg-grid-pattern bg-[length:50px_50px] animate-grid-scroll" />
      
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-smartops-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-4 group cursor-pointer">
            <Activity className="w-16 h-16 text-smartops-primary drop-shadow-[0_0_15px_rgba(0,229,204,0.6)]" />
            <div className="absolute inset-0 bg-smartops-primary blur-xl opacity-40 mix-blend-screen group-hover:opacity-75 transition-opacity" />
          </div>
          <h1 className="text-4xl md:text-5xl font-space font-bold text-white tracking-tight mb-2 text-center">
            SmartOps
          </h1>
          <p className="text-gray-400 font-inter text-center text-lg">
            See where work breaks.
          </p>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.4 }}
        >
          <GlassCard className="!p-8 backdrop-blur-[24px]">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">Workspace Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    defaultValue="admin@smartops.io"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-smartops-primary/50 focus:ring-1 focus:ring-smartops-primary/50 transition-all font-inter"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-gray-300">Password</label>
                  <a href="#" className="text-xs text-smartops-primary opacity-80 hover:opacity-100 transition-opacity">Forgot?</a>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    defaultValue="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-smartops-primary/50 focus:ring-1 focus:ring-smartops-primary/50 transition-all font-inter"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-smartops-primary hover:bg-smartops-glow text-smartops-bg font-space font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(0,229,204,0.3)] hover:shadow-[0_0_30px_rgba(0,229,204,0.5)] transform hover:-translate-y-0.5"
              >
                Access System
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </GlassCard>
        </motion.div>

      </div>
    </motion.div>
  );
}

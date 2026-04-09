import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard';
import { teamMembers } from '../data/mockData';
import { Mail, MoreVertical } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
};

const itemVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 100 } }
};

export default function TeamOverview() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 pb-10"
    >
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-space font-bold text-white tracking-tight">Team Overview</h1>
          <p className="text-gray-400 mt-1 font-inter">Monitor individual workloads and active assignments.</p>
        </div>
        <button className="hidden sm:block text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors font-medium border border-white/5">
          Add Member
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {teamMembers.map((member) => (
          <motion.div key={member.id} variants={itemVariants}>
            <GlassCard className="p-6 relative group overflow-hidden">
              
              {/* Overload Alert Glow Border Top */}
              {member.isOverloaded && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              )}

              <div className="flex justify-between items-start mb-4">
                {/* SVG Circular Meter */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90 absolute inset-0">
                    {/* Background track */}
                    <circle 
                      cx="32" cy="32" r="28" 
                      fill="none" 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeWidth="4" 
                    />
                    {/* Animated Progress indicator */}
                    <motion.circle 
                      cx="32" cy="32" r="28" 
                      fill="none" 
                      stroke={member.isOverloaded ? '#f59e0b' : '#00e5cc'} 
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 28}
                      initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                      animate={{ strokeDashoffset: (2 * Math.PI * 28) * (1 - Math.min(member.workload, 100) / 100) }}
                      transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                      className={member.isOverloaded ? "drop-shadow-[0_0_5px_rgba(245,158,11,0.5)] bg-red" : "drop-shadow-[0_0_5px_rgba(0,229,204,0.5)]"}
                    />
                  </svg>
                  <span className="font-space font-bold text-lg text-white relative z-10">{member.initials}</span>
                </div>

                <button className="text-gray-500 hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="font-space font-semibold text-lg text-white mb-1 group-hover:text-smartops-primary transition-colors">
                  {member.name}
                </h3>
                <p className="text-xs text-gray-400 font-medium mb-4">{member.role}</p>
                
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                   <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Current Focus</p>
                   <p className="text-sm text-gray-200 truncate">{member.currentTask}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg text-sm font-medium transition-colors border border-white/5 flex justify-center items-center gap-2">
                  <Mail className="w-4 h-4" /> Message
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

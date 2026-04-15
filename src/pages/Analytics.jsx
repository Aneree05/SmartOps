import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { workflowVelocity, teamMembers } from '../data/mockData';
import { TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit: { opacity: 0, y: -30, transition: { duration: 0.4 } }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#050d12] border border-smartops-primary/20 p-4 rounded-xl shadow-xl">
        <p className="text-gray-400 text-sm mb-2 font-inter">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-white font-medium">
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  // Sort team members by workload descending
  const leaderboardData = [...teamMembers].sort((a, b) => b.workload - a.workload);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 pb-10"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-space font-bold text-white tracking-tight">Bottleneck Analytics</h1>
        <p className="text-gray-400 mt-1 font-inter">Deep dive into workflow velocity and historical delays.</p>
      </header>

      {/* Top: Large Area Chart */}
      <GlassCard className="h-[450px] flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-space font-semibold text-xl text-white">Workflow Velocity Trend</h3>
            <p className="text-sm text-gray-400">Tasks added vs resolved over time</p>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-smartops-primary glow-active"></div>
              <span className="text-gray-300">Resolved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 opacity-60"></div>
              <span className="text-gray-300">Added</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={workflowVelocity} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5cc" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00e5cc" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: '#9ca3af', fontSize: 12}} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area 
                type="monotone" 
                dataKey="completed" 
                name="Resolved"
                stroke="#00e5cc" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCompleted)" 
                animationDuration={2000}
              />
              <Area 
                type="monotone" 
                dataKey="added" 
                name="Added"
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1} 
                fill="url(#colorAdded)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Middle Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Breakdown Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-space font-semibold text-lg text-white mb-4">Stage Health</h3>
          
          <motion.div whileInView={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: -20 }} viewport={{ once: true }}>
            <GlassCard className="p-4 border-red-500/20 bg-red-500/5 glow-red">
               <div className="flex justify-between items-start">
                 <div>
                   <h4 className="text-red-300 font-medium">Testing Phase</h4>
                   <p className="text-2xl font-bold text-white mt-1">+85% Delay</p>
                 </div>
                 <AlertTriangle className="text-red-400 w-6 h-6" />
               </div>
               <p className="text-xs text-red-300/70 mt-2">Critical bottleneck detected.</p>
            </GlassCard>
          </motion.div>

          <motion.div whileInView={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: -20 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <GlassCard className="p-4 border-amber-500/20 bg-amber-500/5 glow-amber">
               <div className="flex justify-between items-start">
                 <div>
                   <h4 className="text-amber-300 font-medium">In Development</h4>
                   <p className="text-2xl font-bold text-white mt-1">+12% Delay</p>
                 </div>
                 <TrendingUp className="text-amber-400 w-6 h-6" />
               </div>
               <p className="text-xs text-amber-300/70 mt-2">Monitor for potential regression.</p>
            </GlassCard>
          </motion.div>

          <motion.div whileInView={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: -20 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <GlassCard className="p-4 border-smartops-primary/20">
               <div className="flex justify-between items-start">
                 <div>
                   <h4 className="text-smartops-primary font-medium">Design Phase</h4>
                   <p className="text-2xl font-bold text-white mt-1">On Track</p>
                 </div>
                 <CheckCircle2 className="text-smartops-primary w-6 h-6" />
               </div>
               <p className="text-xs text-gray-400 mt-2">-5% under expected time.</p>
            </GlassCard>
          </motion.div>
        </div>

        {/* Team Leaderboard (Ranked Horizontal Bars) */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full flex flex-col p-6">
            <h3 className="font-space font-semibold text-lg text-white mb-6">Team Workload Distribution</h3>
            <div className="flex-1 space-y-5 flex flex-col justify-center">
              {leaderboardData.map((member, i) => (
                <div key={member.id} className="relative">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-200">{member.name}</span>
                    <span className="text-gray-400">{member.workload}% Cap</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${member.isOverloaded ? 'bg-amber-500 glow-amber' : 'bg-smartops-primary glow-active'}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min(member.workload, 100)}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}

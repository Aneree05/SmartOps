import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { AlertBanner } from '../components/Elements';
import { dashboardStats, stageDelays, teamWorkloads } from '../data/mockData';
import { Activity, Clock, Users, Zap } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const StatCard = ({ title, value, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <GlassCard className="flex items-center gap-4 hover:glow-active">
      <div className="p-3 bg-smartops-primary/10 rounded-xl">
        <Icon className="w-6 h-6 text-smartops-primary" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-400 font-inter">{title}</h3>
        <p className="text-2xl font-space font-bold text-white mt-1.5">{value}</p>
      </div>
    </GlassCard>
  </motion.div>
);

export default function Dashboard() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-space font-bold text-white tracking-tight">System Overview</h1>
        <p className="text-gray-400 mt-1 font-inter">Monitor workflow health and detect bottlenecks.</p>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Projects" value={dashboardStats.activeProjects} icon={Activity} delay={0.1} />
        <StatCard title="Tasks In Progress" value={dashboardStats.tasksInProgress} icon={Zap} delay={0.2} />
        <StatCard title="Avg Completion Time" value={dashboardStats.avgCompletionTime} icon={Clock} delay={0.3} />
        <StatCard title="Team Efficiency" value={`${dashboardStats.teamEfficiencyScore}%`} icon={Users} delay={0.4} />
      </div>

      {/* Bottleneck Alert */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <AlertBanner 
          message={`${dashboardStats.bottleneckAlert.stage} stage is causing ${dashboardStats.bottleneckAlert.delayPercent}% delay in ${dashboardStats.bottleneckAlert.project}`}
          type="danger"
        />
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <GlassCard className="h-[400px] flex flex-col">
            <h3 className="font-space font-semibold text-lg mb-6">Stage Delay Analysis</h3>
            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageDelays} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="stage" stroke="rgba(255,255,255,0.5)" tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: '#9ca3af', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#050d12', border: '1px solid rgba(0,229,204,0.2)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="expected" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} name="Expected (hrs)" animationDuration={1500} />
                  <Bar dataKey="delay" fill="#00e5cc" radius={[4, 4, 0, 0]} name="Actual Delay (hrs)" animationDuration={1500}>
                    {
                      stageDelays.map((entry, index) => (
                        <cell key={`cell-${index}`} fill={entry.delay > entry.expected * 1.5 ? '#ef4444' : '#00e5cc'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <GlassCard className="h-[400px] flex flex-col">
            <h3 className="font-space font-semibold text-lg mb-2">Team Workload Distribution</h3>
            <div className="flex-1 min-h-0 w-full relative -mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={teamWorkloads}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar name="Workload" dataKey="A" stroke="#00e5cc" fill="#00e5cc" fillOpacity={0.2} animationDuration={1500} />
                  <Tooltip contentStyle={{ backgroundColor: '#050d12', border: '1px solid rgba(0,229,204,0.2)', borderRadius: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}

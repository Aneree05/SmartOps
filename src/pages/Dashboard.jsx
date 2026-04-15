import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { AlertBanner, SkeletonLoader } from '../components/Elements';
import { dashboardStats, stageDelays, teamWorkloads } from '../data/mockData';
import { Activity, Clock, Users, Zap } from 'lucide-react';
import { getProjects } from '../services/api';
import { useAuth } from '../context/AuthContext';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const StatCard = ({ title, value, icon: Icon, delay, loading }) => (
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
        {loading ? (
          <SkeletonLoader className="h-8 w-16 mt-1.5" />
        ) : (
          <p className="text-2xl font-space font-bold text-white mt-1.5">{value}</p>
        )}
      </div>
    </GlassCard>
  </motion.div>
);

export default function Dashboard() {
  const { logout } = useAuth();
  const [activeProjects, setActiveProjects] = useState(0);
  const [tasksInProgress, setTasksInProgress] = useState(0);
  const [avgCompletionTime, setAvgCompletionTime] = useState('—');
  const [teamEfficiency, setTeamEfficiency] = useState('—');
  const [firstProjectName, setFirstProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projects = await getProjects();
        setActiveProjects(projects.length);
        
        const inProgress = projects.reduce((sum, p) => sum + (p.stages?.length || 0), 0);
        setTasksInProgress(inProgress);

        setAvgCompletionTime(projects.length > 0 ? (projects.length * 1.6).toFixed(1) + ' Days' : '—');
        setTeamEfficiency(projects.length > 0 ? Math.min(70 + projects.length * 3, 99) + '%' : '—');
        
        if (projects.length > 0) {
          setFirstProjectName(projects[0].name || '');
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [logout]);

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
        <StatCard title="Active Projects" value={activeProjects} icon={Activity} delay={0.1} loading={loading} />
        <StatCard title="Tasks In Progress" value={tasksInProgress} icon={Zap} delay={0.2} loading={loading} />
        <StatCard title="Avg Completion Time" value={avgCompletionTime} icon={Clock} delay={0.3} loading={loading} />
        <StatCard title="Team Efficiency" value={teamEfficiency} icon={Users} delay={0.4} loading={loading} />
      </div>

      {/* Bottleneck Alert */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <AlertBanner 
          message={`${dashboardStats.bottleneckAlert.stage} stage is causing ${dashboardStats.bottleneckAlert.delayPercent}% delay in ${firstProjectName || dashboardStats.bottleneckAlert.project}`}
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

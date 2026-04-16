import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { SkeletonLoader } from '../components/Elements';
import { Activity, Clock, Users, Zap, AlertTriangle } from 'lucide-react';
import { getProjects, getAnalyticsSummary, getTasks } from '../services/api';
import { socket } from '../services/socket';

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
    <GlassCard className="flex items-center gap-4 hover:shadow-[0_0_20px_rgba(0,229,204,0.15)] transition-shadow">
      <div className="p-3 bg-[#00e5cc]/10 rounded-xl">
        <Icon className="w-6 h-6 text-[#00e5cc]" />
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
  const [activeProjects, setActiveProjects] = useState(0);
  const [tasksInProgress, setTasksInProgress] = useState(0);
  const [avgCompletionTime, setAvgCompletionTime] = useState('—');
  const [teamEfficiency, setTeamEfficiency] = useState('—');
  
  const [analytics, setAnalytics] = useState(null);
  const [firstProjectName, setFirstProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setFirstProjectName("Default Project");

      // Fetch Tasks and Analytics
      const [tasks, analyticsData] = await Promise.all([
        getTasks(),
        getAnalyticsSummary()
      ]);

      setActiveProjects(1);
      setTasksInProgress(tasks.filter(t => t.status === 'active').length);
      
      // Calculate basic global avg completion if Done exists
      if (analyticsData.avgTimes && analyticsData.avgTimes["Done"]) {
        setAvgCompletionTime(`${analyticsData.avgTimes["Done"]} Hrs`);
      } else {
        setAvgCompletionTime('—');
      }

      // Just a mock display calculation for efficiency
      setTeamEfficiency(tasks.length > 0 ? Math.min(70 + (tasksInProgress > 0 ? 5 : 0), 99) + '%' : '—');

      setAnalytics(analyticsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tasksInProgress]);

  useEffect(() => {
    fetchDashboardData();

    // Setup Auto Refresh interval - 30 seconds
    const intervalId = setInterval(fetchDashboardData, 30000);

    // Socket updates
    socket.connect();
    socket.on('task:moved', fetchDashboardData);
    socket.on('task:created', fetchDashboardData);
    socket.on('task:deleted', fetchDashboardData);

    return () => {
      clearInterval(intervalId);
      socket.off('task:moved', fetchDashboardData);
      socket.off('task:created', fetchDashboardData);
      socket.off('task:deleted', fetchDashboardData);
      socket.disconnect();
    };
  }, [fetchDashboardData]);

  // Formats for Recharts
  const stageDelayData = analytics?.avgTimes ? Object.entries(analytics.avgTimes).map(([stage, hrs]) => ({
    stage, delay: Number(hrs).toFixed(1), expected: 24 // static expected 24 for viz baseline
  })) : [];

  const workloadData = analytics?.workload ? Object.entries(analytics.workload).map(([subject, info]) => ({
    subject, A: info.count * 20, fullMark: 100 // mapped to radar 0-100 scale
  })) : [];

  const topBottleneck = analytics?.bottlenecks && analytics.bottlenecks[0];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 pb-12 text-white bg-[#050d12] min-h-screen p-6"
    >
      <header className="mb-8">
        <h1 className="text-4xl font-space font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00e5cc] to-[#3b82f6]">System Overview</h1>
        <p className="text-gray-400 mt-2 font-inter">Monitor workflow health and detect bottlenecks.</p>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Projects" value={activeProjects} icon={Activity} delay={0.1} loading={loading} />
        <StatCard title="Tasks In Progress" value={tasksInProgress} icon={Zap} delay={0.2} loading={loading} />
        <StatCard title="Avg Completion Time" value={avgCompletionTime} icon={Clock} delay={0.3} loading={loading} />
        <StatCard title="Team Efficiency" value={teamEfficiency} icon={Users} delay={0.4} loading={loading} />
      </div>

      {/* Bottleneck Alert */}
      {topBottleneck && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3">
            <AlertTriangle className="text-red-500 w-6 h-6" />
            <p className="font-medium text-red-200">
              <span className="font-bold">{topBottleneck.stageId}</span> stage is causing <span className="font-bold">{topBottleneck.delayPercent}%</span> delay in {firstProjectName}
            </p>
          </div>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <GlassCard className="h-[400px] flex flex-col p-6">
            <h3 className="font-space font-semibold text-lg mb-6">Stage Delay Analysis (Average Hours)</h3>
            <div className="flex-1 min-h-0 w-full relative">
              {stageDelayData.length === 0 && !loading && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">No data available</div>
              )}
              {stageDelayData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageDelayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="stage" stroke="rgba(255,255,255,0.3)" tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{fill: '#9ca3af', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#050d12', border: '1px solid rgba(0,229,204,0.2)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="delay" fill="#00e5cc" radius={[4, 4, 0, 0]} name="Actual Avg (hrs)" animationDuration={1000} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <GlassCard className="h-[400px] flex flex-col p-6">
            <h3 className="font-space font-semibold text-lg mb-2">Team Workload Distribution</h3>
            <div className="flex-1 min-h-0 w-full relative -mt-4">
              {workloadData.length === 0 && !loading && (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-500 mt-10">No workload data</div>
              )}
              {workloadData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={workloadData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Workload Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} animationDuration={1000} />
                    <Tooltip contentStyle={{ backgroundColor: '#050d12', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}

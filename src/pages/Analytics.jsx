import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { GlassCard } from "../components/GlassCard";
import { AlertTriangle, Clock, Activity, CheckCircle2 } from "lucide-react";
import { getAnalyticsSummary, getProjects } from "../services/api";
import { socket } from "../services/socket";

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit: { opacity: 0, y: -30, transition: { duration: 0.4 } }
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#050d12] border border-[#00e5cc]/20 p-4 rounded-xl shadow-xl">
        <p className="text-gray-400 text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
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
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await getAnalyticsSummary();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();

    // Socket updates
    socket.connect();
    socket.on('task:moved', fetchAnalytics);
    socket.on('task:created', fetchAnalytics);
    socket.on('task:deleted', fetchAnalytics);

    return () => {
      socket.off('task:moved', fetchAnalytics);
      socket.off('task:created', fetchAnalytics);
      socket.off('task:deleted', fetchAnalytics);
      socket.disconnect();
    };
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh] bg-[#050d12]">
        <div className="w-10 h-10 border-4 border-[#00e5cc] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh] bg-[#050d12]">
        <div className="text-red-500 bg-red-500/10 p-6 rounded-xl border border-red-500/20 shadow-lg">
          <AlertTriangle className="w-8 h-8 mb-2 mx-auto" />
          <h2 className="text-xl font-bold text-center">Error Loading Analytics</h2>
          <p className="text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  // Convert avgTimes → Bar Chart format
  const chartData = Object.entries(analytics.avgTimes || {}).map(
    ([stage, value]) => ({
      name: stage,
      avgHours: value,
    })
  );

  // Convert workload object to array for chart
  const workloadData = Object.entries(analytics.workload || {}).map(
    ([user, data]) => ({
      user,
      count: data.count,
      overloaded: data.overloaded
    })
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 pb-12 min-h-screen bg-[#050d12] text-white p-6"
    >
      <header className="mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00e5cc] to-[#3b82f6]">
          Intelligence Layer
        </h1>
        <p className="text-gray-400 mt-2 font-inter">Deep dive into real-time bottleneck parameters</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Performance / Bar Chart */}
        <GlassCard className="p-6 h-[400px]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#00e5cc]" />
            Average Time per Stage (Hours)
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgHours" fill="#00e5cc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Workload Distribution */}
        <GlassCard className="p-6 h-[400px]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#3b82f6]" />
            Workload Distribution
          </h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={workloadData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="#aaa" />
              <YAxis dataKey="user" type="category" stroke="#aaa" width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {workloadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.overloaded ? "#ef4444" : "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Bottleneck Alerts */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-400">
            <AlertTriangle className="w-5 h-5" />
            Bottleneck Stages
          </h3>
          {(!analytics.bottlenecks || analytics.bottlenecks.length === 0) ? (
            <p className="text-gray-400">No bottlenecks detected at this time.</p>
          ) : (
            <div className="space-y-3">
              {analytics.bottlenecks.map((b) => (
                <div key={b.stageId} className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg flex justify-between items-center group hover:bg-orange-500/20 transition-colors">
                  <div>
                    <h4 className="font-bold text-orange-400 text-lg">{b.stageId}</h4>
                    <p className="text-sm text-gray-400">Avg Time: {b.avgHours} hours</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-bold shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                      {b.delayPercent}% of Delay
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Stuck Tasks Warning List */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500">
            <Clock className="w-5 h-5" />
            Stuck Tasks
          </h3>
          {(!analytics.stuckTasks || analytics.stuckTasks.length === 0) ? (
             <p className="text-gray-400">No stuck tasks violating expectations.</p>
          ) : (
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
               {analytics.stuckTasks.map((task, i) => (
                 <div key={task.task_id || i} className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                   <div className="flex justify-between items-start mb-2">
                     <span className="font-bold text-white text-lg">{task.title}</span>
                     <span className="text-red-400 text-sm font-semibold whitespace-nowrap ml-2 bg-red-500/20 px-2 py-0.5 rounded">
                       {task.hoursStuck}h idle
                     </span>
                   </div>
                   <div className="text-sm text-gray-400">
                     Current Stage: <span className="text-[#00e5cc] font-medium">{task.stage_id}</span>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </GlassCard>

        {/* Insights / Bullet List */}
        <GlassCard className="p-6 md:col-span-2">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#00e5cc]">
            <CheckCircle2 className="w-5 h-5" />
            Automatically Generated Intelligence
          </h3>
          <ul className="space-y-3 mt-4">
            {(!analytics.insights || analytics.insights.length === 0) ? (
              <p className="text-gray-400">Not enough data to form meaningful insights right now.</p>
            ) : (
              analytics.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-3 bg-white/5 p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-[#00e5cc] mt-2 flex-shrink-0 shadow-[0_0_8px_#00e5cc]" />
                  <span className="text-gray-200 text-lg">{insight}</span>
                </li>
              ))
            )}
          </ul>
        </GlassCard>
      </div>
    </motion.div>
  );
}

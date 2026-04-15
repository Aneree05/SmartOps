import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GlassCard } from "../components/GlassCard";
import { TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit: { opacity: 0, y: -30, transition: { duration: 0.4 } },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#050d12] border border-smartops-primary/20 p-4 rounded-xl shadow-xl">
        <p className="text-gray-400 text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
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

  useEffect(() => {
    fetch("http://localhost:5000/api/analytics/summary")
      .then((res) => res.json())
      .then((data) => {
        console.log("REAL DATA:", data);
        setAnalytics(data);
      })
      .catch((err) => console.error(err));
  }, []);

  if (!analytics) {
    return <div className="text-white p-10">Loading analytics...</div>;
  }

  // Convert avgTimes → chart format
  const chartData = Object.entries(analytics.avgTimes || {}).map(
    ([stage, value]) => ({
      name: stage,
      completed: value,
      added: value + 2,
    }),
  );

  // Convert workload → leaderboard
  const leaderboardData = Object.entries(analytics.workload || {}).map(
    ([user, count]) => ({
      id: user,
      name: user,
      workload: count * 20,
      isOverloaded: count >= 3,
    }),
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 pb-10"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Bottleneck Analytics</h1>
        <p className="text-gray-400">Real-time workflow insights</p>
      </header>

      {/* Chart */}
      <GlassCard className="h-[400px] p-6">
        <h3 className="text-white mb-4">Stage Performance</h3>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis dataKey="name" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="completed"
              stroke="#00e5cc"
              fillOpacity={0.2}
              fill="#00e5cc"
            />

            <Area
              type="monotone"
              dataKey="added"
              stroke="#3b82f6"
              fillOpacity={0.1}
              fill="#3b82f6"
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Insights */}
      <GlassCard className="p-6">
        <h3 className="text-white mb-4">Insights</h3>

        {analytics.insights.length === 0 ? (
          <p className="text-gray-400">No insights yet (add tasks)</p>
        ) : (
          analytics.insights.map((insight, i) => (
            <div key={i} className="text-white mb-2">
              • {insight}
            </div>
          ))
        )}
      </GlassCard>

      {/* Workload */}
      <GlassCard className="p-6">
        <h3 className="text-white mb-4">Team Workload</h3>

        {leaderboardData.map((member) => (
          <div key={member.id} className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-200">{member.name}</span>
              <span className="text-gray-400">{member.workload}%</span>
            </div>

            <div className="h-3 bg-gray-700 rounded">
              <div
                className={`h-3 rounded ${
                  member.isOverloaded ? "bg-red-500" : "bg-green-400"
                }`}
                style={{ width: `${Math.min(member.workload, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </GlassCard>
    </motion.div>
  );
}

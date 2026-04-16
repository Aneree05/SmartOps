import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GlassCard } from '../components/GlassCard';
import { AlertBanner, SkeletonLoader } from '../components/Elements';
import { dashboardStats, stageDelays, teamWorkloads } from '../data/mockData';
import { Activity, Clock, Users, Zap, Plus, MessageSquare } from 'lucide-react';
import { getProjects, joinTeam, getBroadcasts, sendBroadcast } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const { user, logout, socket, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeProjects, setActiveProjects] = useState(0);
  const [activeProjectsList, setActiveProjectsList] = useState([]);
  const [tasksInProgress, setTasksInProgress] = useState(0);
  const [avgCompletionTime, setAvgCompletionTime] = useState('—');
  const [teamEfficiency, setTeamEfficiency] = useState('—');
  const [firstProjectName, setFirstProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  // New states for Join Team & Broadcasts
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [teamCode, setTeamCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [broadcasts, setBroadcasts] = useState([]);
  const [newBroadcast, setNewBroadcast] = useState('');

  useEffect(() => {
    if (socket) {
      // Must define the listener
      const handleReceive = (message) => {
        setBroadcasts((prev) => [...prev, message]);
      };
      socket.on('receiveBroadcast', handleReceive);
      return () => {
        socket.off('receiveBroadcast', handleReceive);
      };
    }
  }, [socket]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projects = await getProjects();
        setActiveProjectsList(projects);
        setActiveProjects(projects.length);
        
        const inProgress = projects.reduce((sum, p) => sum + (p.stages?.length || 0), 0);
        setTasksInProgress(inProgress);

        setAvgCompletionTime(projects.length > 0 ? (projects.length * 1.6).toFixed(1) + ' Days' : '—');
        setTeamEfficiency(projects.length > 0 ? Math.min(70 + projects.length * 3, 99) + '%' : '—');
        
        if (projects.length > 0) {
          setFirstProjectName(projects[0].name || '');
          
          if (socket) {
            projects.forEach(p => socket.emit('joinProject', p._id));
          }

          const fetchedBroadcasts = await getBroadcasts(projects[0]._id);
          setBroadcasts(fetchedBroadcasts);
        }
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('token')) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [logout, user?._id]);

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    try {
      setJoinError('');
      // Convert to uppercase
      const code = teamCode.toUpperCase();
      await joinTeam(code);
      // Update local storage and context
      const updatedUser = { ...user, teamId: code };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setJoinModalOpen(false);
      navigate('/kanban');
    } catch (err) {
      setJoinError('Invalid team ID or already joined.');
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!newBroadcast.trim() || !activeProjectsList.length) return;
    
    const projectId = activeProjectsList[0]._id;
    try {
      if (socket) socket.emit('sendBroadcast', { projectId, content: newBroadcast });
      setNewBroadcast('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-space font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-gray-400 mt-1 font-inter">Monitor workflow health and detect bottlenecks.</p>
        </div>
        {['team_leader', 'manager', 'admin'].includes(user?.role) && user?.teamId && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
             <span className="text-gray-400 font-medium text-sm">Team ID:</span>
             <span className="text-white font-space font-bold tracking-widest bg-smartops-primary/20 px-3 py-1 rounded text-lg border border-smartops-primary/30">
               {user.teamId}
             </span>
          </div>
        )}
        {user?.role === 'member' && !user?.teamId && (
          <button
            onClick={() => setJoinModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-smartops-primary text-black font-space font-semibold rounded-lg hover:bg-[#00c2ad] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Join Team
          </button>
        )}
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

      {/* Announcements and Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Active Broadcasts Feed */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5, delay: 0.6 }}
           className="lg:col-span-1 flex flex-col h-[400px]"
        >
          <GlassCard className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <h3 className="font-space font-semibold text-lg flex items-center justify-between mb-4 border-b border-white/10 pb-4">
              <span>Announcements</span>
              <MessageSquare className="w-5 h-5 text-smartops-primary" />
            </h3>
            
            {['team_leader', 'manager', 'admin'].includes(user?.role) && (
              <form onSubmit={handleSendBroadcast} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newBroadcast}
                  onChange={(e) => setNewBroadcast(e.target.value)}
                  placeholder="Broadcast message..."
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-smartops-primary"
                />
                <button type="submit" className="bg-smartops-primary text-black px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#00c2ad] transition-colors whitespace-nowrap shrink-0">
                  Send
                </button>
              </form>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {broadcasts.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No active announcements.</p>
              ) : (
                broadcasts.map((b, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-bold text-smartops-primary">{b.sender?.name || 'System'}</span>
                      <span className="text-gray-500">{new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm text-gray-300">{b.content}</p>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Charts Grid spanning 2 columns */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bar Chart */}
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

          {/* Radar Chart */}
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
        </div>
      </div>

      {/* Join Team Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl"
          >
            <h2 className="text-2xl font-space font-bold text-white mb-2">Join Team</h2>
            <p className="text-sm text-gray-400 mb-6 font-inter">Enter the unique team ID given by your manager.</p>
            
            <form onSubmit={handleJoinTeam}>
              <div className="mb-4">
                <label className="block text-sm text-gray-300 font-medium mb-1">Team Code (Project ID)</label>
                <input
                  type="text"
                  required
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-smartops-primary transition-colors"
                  placeholder="Paste object ID here..."
                />
              </div>
              
              {joinError && (
                <p className="text-red-400 text-sm mb-4">{joinError}</p>
              )}
              
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white/5 text-white hover:bg-white/10 rounded-lg transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-smartops-primary text-black hover:bg-[#00c2ad] rounded-lg transition-colors font-semibold"
                >
                  Join Now
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

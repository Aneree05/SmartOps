import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/GlassCard';
import { teamMembers } from '../data/mockData';
import { Mail, MoreVertical, X, Loader } from 'lucide-react';
import { getProjects, addMember } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [projectId, setProjectId] = useState(null);
  const [actualTeamMembers, setActualTeamMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getProjects()
      .then(projects => {
        if (projects.length > 0) {
           setProjectId(projects[0]._id);
           
           const memberMap = new Map();
           projects.forEach(p => {
             if (p.members) {
               p.members.forEach(m => {
                 if (m.user && m.user._id !== currentUser?._id) {
                     memberMap.set(m.user._id, {
                        ...m.user,
                        projectRole: m.role,
                        projectId: p._id
                     });
                 }
               });
             }
           });
           setActualTeamMembers(Array.from(memberMap.values()));
        }
      })
      .catch(console.error);
  }, [currentUser?._id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!projectId) return setError("No project loaded");
    if (!userId.trim()) return setError("User ID is required");
    
    setLoading(true);
    setError('');
    try {
      await addMember(projectId, userId, role);
      setSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
        setUserId('');
        setRole('member');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="hidden sm:block text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors font-medium border border-white/5"
        >
          Add Member
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {actualTeamMembers.length === 0 ? (
           <p className="text-gray-500 font-inter py-8 col-span-full text-center">No other team members found.</p>
        ) : actualTeamMembers.map((member) => (
          <motion.div key={member._id} variants={itemVariants}>
            <GlassCard className="p-6 relative group overflow-hidden">
               <div className="flex justify-between items-start mb-4">
                <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-smartops-primary/20 text-smartops-primary border border-smartops-primary/30">
                  <span className="font-space font-bold text-2xl text-white relative z-10">{member.name.charAt(0).toUpperCase()}</span>
                </div>
               </div>
               
               <div>
                  <h3 className="font-space font-semibold text-lg text-white mb-1 group-hover:text-smartops-primary transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mb-4 capitalize">{member.projectRole || 'member'}</p>
                  
                  <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                     <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Email</p>
                     <p className="text-sm text-gray-200 truncate">{member.email}</p>
                  </div>
               </div>

               <div className="mt-6 flex gap-2">
                  <button 
                    onClick={() => navigate('/messages', { state: { memberId: member._id, memberName: member.name } })}
                    className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg text-sm font-medium transition-colors border border-white/5 flex justify-center items-center gap-2 group-hover:border-smartops-primary/50 group-hover:text-smartops-primary"
                  >
                    <Mail className="w-4 h-4" /> Message
                  </button>
               </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md"
            >
              <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-space font-bold text-white">Add Member</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">User ID</label>
                    <input 
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-smartops-primary"
                      value={userId}
                      onChange={e => setUserId(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-smartops-primary [&>option]:bg-gray-800"
                      value={role}
                      onChange={e => setRole(e.target.value)}
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  
                  {error && <p className="text-amber-500 text-sm">{error}</p>}
                  {success && <p className="text-[#00e5cc] text-sm">Member added!</p>}

                  <button 
                    type="submit" 
                    disabled={loading || success}
                    className="w-full mt-4 bg-smartops-primary text-smartops-bg font-bold py-2 rounded-xl hover:bg-[#00e5cc]/90 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Add to Project"}
                  </button>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

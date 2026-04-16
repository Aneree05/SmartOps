import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getProjects, getDMs, sendDM, getBroadcasts, sendBroadcast } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { MessageSquare, Send, Users, Megaphone } from 'lucide-react';

export default function Messages() {
  const { user, socket } = useAuth();
  const location = useLocation();
  const [members, setMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [activeTab, setActiveTab] = useState('dm'); // 'dm' or 'announcements'
  const [broadcasts, setBroadcasts] = useState([]);
  const [newBroadcast, setNewBroadcast] = useState('');
  
  const messagesEndRef = useRef(null);

  // Socket listeners
  useEffect(() => {
    if (socket) {
      const handleReceiveDM = (msg) => {
        const sId = String(msg.sender?._id || msg.sender?.id || msg.sender);
        const rId = String(msg.receiver?._id || msg.receiver?.id || msg.receiver);
        const selectedId = String(selectedUser?._id);
        
        if (sId === selectedId || rId === selectedId) {
          setMessages((prev) => [...prev, msg]);
        }
      };
      const handleReceiveBroadcast = (msg) => {
        setBroadcasts((prev) => [...prev, msg]);
      };
      
      socket.on('receiveDM', handleReceiveDM);
      socket.on('receiveBroadcast', handleReceiveBroadcast);
      
      return () => {
        socket.off('receiveDM', handleReceiveDM);
        socket.off('receiveBroadcast', handleReceiveBroadcast);
      };
    }
  }, [socket, selectedUser]);

  // Fetch projects to extract deduplicated members and current project
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const projects = await getProjects();

        const memberMap = new Map();
        projects.forEach(p => {
          if (p.members) {
            p.members.forEach(m => {
              if (m.user && m.user._id !== user?._id) {
                 memberMap.set(m.user._id, { ...m.user, projectId: p._id }); 
              }
            });
          }
          if (socket) {
             socket.emit('joinProject', p._id);
          }
        });
        const membersArr = Array.from(memberMap.values());
        setMembers(membersArr);
        
        // Handle navigation state
        if (location.state?.memberId) {
           const found = membersArr.find(x => x._id === location.state.memberId);
           if (found) setSelectedUser(found);
           setActiveTab('dm');
        }

      } catch (err) {
        console.error('Error fetching members:', err);
      }
    };
    if (user?._id) {
        fetchTeamMembers();
    }
  }, [user?._id, location.state]);

  // Fetch conversation when a user is selected
  useEffect(() => {
    if (selectedUser) {
      const fetchConversation = async () => {
        try {
          const m = await getDMs(selectedUser._id);
          setMessages(m);
        } catch(err) {
          console.error('Error fetching DMs:', err);
        }
      }
      fetchConversation();
    }
  }, [selectedUser]);

  // Fetch broadcasts
  useEffect(() => {
    if (activeTab === 'announcements' && members.length > 0 && broadcasts.length === 0) {
      const fetchBroadcasts = async () => {
        try {
           const pId = members[0].projectId;
           const b = await getBroadcasts(pId);
           setBroadcasts(b);
        } catch(err) {
           console.error('Error fetching broadcasts:', err);
        }
      }
      fetchBroadcasts();
    }
  }, [activeTab, members, broadcasts.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !user?._id) return;
    
    try {
      const content = newMessage;
      if (socket) {
        socket.emit('sendDM', { 
          receiverId: selectedUser._id, 
          content, 
          projectId: selectedUser.projectId 
        });
      }
      
      // Sender update handled via socket
      setNewMessage('');
    } catch(err) {
      console.error('Error sending message:', err);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!newBroadcast.trim()) return;
    
    let pId = members.length > 0 ? members[0].projectId : null;
    if (!pId) {
       const projects = await getProjects();
       if (projects.length > 0) pId = projects[0]._id;
    }
    if (!pId) return;

    try {
       if (socket) socket.emit('sendBroadcast', { projectId: pId, content: newBroadcast });
       setNewBroadcast('');
    } catch (err) {
       console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-4">
        <button 
          onClick={() => setActiveTab('dm')}
          className={`px-6 py-2 rounded-xl font-space font-semibold transition-all ${activeTab === 'dm' ? 'bg-smartops-primary text-black' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
        >
          Direct Messages
        </button>
        <button 
          onClick={() => setActiveTab('announcements')}
          className={`px-6 py-2 rounded-xl font-space font-semibold transition-all flex items-center gap-2 ${activeTab === 'announcements' ? 'bg-smartops-primary text-black' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
        >
          <Megaphone className="w-4 h-4" /> Team Announcements
        </button>
      </div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6 max-h-[80vh]"
    >
      <GlassCard className="w-full md:w-1/3 flex flex-col p-4">
        <h2 className="text-xl font-space font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-smartops-primary" /> Members
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {members.map(m => (
            <button
              key={m._id}
              onClick={() => setSelectedUser(m)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors border ${selectedUser?._id === m._id ? 'bg-smartops-primary/20 border-smartops-primary' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
            >
              <div className="font-semibold text-white">{m.name}</div>
              <div className="text-xs text-gray-400">{m.email}</div>
            </button>
          ))}
          {members.length === 0 && <p className="text-gray-500 text-sm italic">No team members found.</p>}
        </div>
      </GlassCard>

      <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden min-h-[500px]">
        {activeTab === 'dm' ? (
          selectedUser ? (
            <>
              <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-smartops-primary/20 flex items-center justify-center text-smartops-primary font-bold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-400">Direct Message</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-black/10">
                {messages.length === 0 && (
                  <p className="text-center text-gray-500 italic mt-8">No messages yet. Say hi!</p>
                )}
                {messages.map((m, i) => {
                  const isMe = String(m.sender?._id || m.sender?.id || m.sender) === String(user?._id || user?.id);
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-xl px-4 py-2 shadow-md ${isMe ? 'bg-smartops-primary text-black' : 'bg-white/10 text-white'}`}>
                        <div className="text-sm font-medium">{m.content}</div>
                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-black/60' : 'text-gray-400'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-white/10 bg-white/5">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-smartops-primary"
                  />
                  <button type="submit" className="bg-smartops-primary text-black px-4 py-2 rounded-lg hover:bg-[#00c2ad] transition-colors flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-black/10">
              <MessageSquare className="w-16 h-16 mb-4 text-white/10" />
              <p>Select a team member from the sidebar to start messaging</p>
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
              <Megaphone className="w-6 h-6 text-smartops-primary" />
              <div>
                <h3 className="font-bold text-white">Team Announcements</h3>
                <p className="text-xs text-gray-400">Global Broadcast Channel</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-black/10">
              {broadcasts.length === 0 ? (
                <p className="text-center text-gray-500 italic mt-8">No announcements yet.</p>
              ) : (
                broadcasts.map((b, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4 shadow-md max-w-[80%]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-smartops-primary text-sm flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-smartops-primary animate-pulse"/>
                         {b.sender?.name || 'System'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{b.content}</p>
                  </div>
                ))
              )}
            </div>

            {['team_leader', 'manager', 'admin'].includes(user?.role) && (
               <div className="p-4 border-t border-white/10 bg-white/5">
                 <form onSubmit={handleSendBroadcast} className="flex gap-2">
                   <input
                     type="text"
                     value={newBroadcast}
                     onChange={(e) => setNewBroadcast(e.target.value)}
                     placeholder="Broadcast an announcement to the team..."
                     className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-smartops-primary"
                   />
                   <button type="submit" className="bg-smartops-primary text-black px-4 py-2 rounded-lg hover:bg-[#00c2ad] transition-colors flex items-center justify-center font-bold">
                     Broadcast
                   </button>
                 </form>
               </div>
            )}
          </div>
        )}
      </GlassCard>
    </motion.div>
    </div>
  );
}

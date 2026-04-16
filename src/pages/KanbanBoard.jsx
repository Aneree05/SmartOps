import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GlassCard } from '../components/GlassCard';
import { Clock, X, Loader } from 'lucide-react';
import { cn } from '../utils/cn';
import { getProjects, getTasks, createTask, moveTask } from '../services/api';
import { socket } from '../services/socket';

const STAGE_MAP = {
  'To Do': 'todo',
  'In Development': 'inDev',
  'In Testing': 'inTesting',
  'Done': 'done'
};

const REVERSE_STAGE_MAP = {
  'todo': 'To Do',
  'inDev': 'In Development',
  'inTesting': 'In Testing',
  'done': 'Done'
};

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

export default function KanbanBoard() {
  const [data, setData] = useState({
    tasks: {},
    columns: {
      todo: { id: 'todo', title: 'To Do', taskIds: [] },
      inDev: { id: 'inDev', title: 'In Development', taskIds: [] },
      inTesting: { id: 'inTesting', title: 'In Testing', taskIds: [] },
      done: { id: 'done', title: 'Done', taskIds: [] }
    },
    columnOrder: ['todo', 'inDev', 'inTesting', 'done'],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assigned_to: '', priority: 'medium', stage_id: 'To Do', estimated_days: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRealTasks = useCallback(async () => {
    try {
      const tasks = await getTasks();
      
      const newTasks = {};
      const newColumns = {
        todo: { id: 'todo', title: 'To Do', taskIds: [] },
        inDev: { id: 'inDev', title: 'In Development', taskIds: [] },
        inTesting: { id: 'inTesting', title: 'In Testing', taskIds: [] },
        done: { id: 'done', title: 'Done', taskIds: [] }
      };

      tasks.forEach(t => {
        newTasks[t._id] = {
          id: t._id,
          content: t.title,
          priority: t.priority,
          assigned_to: t.assigned_to,
          // Calculate approx days in stage based on stage_entered_at comparing to now
          daysInStage: Math.floor((new Date() - new Date(t.stage_entered_at)) / (1000 * 60 * 60 * 24))
        };
        const colId = STAGE_MAP[t.stage_id] || 'todo';
        newColumns[colId].taskIds.push(t._id);
      });

      setData({
        tasks: newTasks,
        columns: newColumns,
        columnOrder: ['todo', 'inDev', 'inTesting', 'done']
      });
    } catch (err) {
      console.log('Failed to load tasks:', err);
    }
  }, []);

  useEffect(() => {
    socket.connect();
    
    const handleTaskMoved = () => loadRealTasks();
    const handleTaskCreated = () => loadRealTasks();
    const handleTaskDeleted = () => loadRealTasks();

    socket.on('task:moved', handleTaskMoved);
    socket.on('task:created', handleTaskCreated);
    socket.on('task:deleted', handleTaskDeleted);
    
    return () => {
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.disconnect();
    };
  }, [loadRealTasks]);

  useEffect(() => {
    loadRealTasks();
  }, [loadRealTasks]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.assigned_to.trim()) {
      setError("Title and Assignee are required");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createTask({ ...newTask });
      loadRealTasks(); // Immediate local fetch
      setTimeout(() => {
        setIsModalOpen(false);
        setNewTask({ title: '', assigned_to: '', priority: 'medium', stage_id: 'To Do', estimated_days: 1 });
      }, 300);
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return; // No change in order or column
    }

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    // moving locally optimistically
    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...start, taskIds: newTaskIds };
      setData((prev) => ({
        ...prev,
        columns: { ...prev.columns, [newColumn.id]: newColumn },
      }));
      return;
    }

    // moving cross-column
    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...start, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, taskIds: finishTaskIds };

    setData((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    }));

    // Update DB
    try {
      await moveTask(draggableId, REVERSE_STAGE_MAP[finish.id]);
    } catch (err) {
      console.error('Failed to update task stage', err);
      loadRealTasks(); // rollback on error
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-[calc(100vh-120px)] flex flex-col"
    >
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-space font-bold text-white tracking-tight">Active Sprints</h1>
          <p className="text-gray-400 mt-1 font-inter">Manage tasks and track progression cleanly.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors font-medium border border-white/5 text-white"
        >
          Add Task
        </button>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 min-h-0 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
          {data.columnOrder.map((columnId) => {
            const column = data.columns[columnId];
            const tasks = column.taskIds.map((taskId) => data.tasks[taskId]).filter(Boolean);

            return (
              <GlassCard key={column.id} className="min-w-[280px] flex flex-col bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-space font-semibold text-lg text-white">{column.title}</h3>
                  <span className="bg-[#00e5cc]/20 text-[#00e5cc] text-xs font-bold px-2.5 py-1 rounded-full">
                    {tasks.length}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 min-h-[150px] transition-colors rounded-xl p-2",
                        snapshot.isDraggingOver ? "bg-white/5 border border-dashed border-[#00e5cc]/30" : "bg-transparent border border-transparent"
                      )}
                    >
                      <AnimatePresence>
                        {tasks.map((task, index) => {
                          const isDelayed = task.daysInStage > 2; // Arbitrary 2 day delay highlight locally
                          
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    "mb-3 rounded-xl p-4 glass-panel bg-white/5 border border-white/10 transition-shadow",
                                    snapshot.isDragging ? "shadow-2xl scale-[1.02] rotate-1 z-50 border-[#00e5cc]/40" : "",
                                    !snapshot.isDragging && isDelayed && column.id !== "done" ? "border-amber-500/30 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : ""
                                  )}
                                  style={{ ...provided.draggableProps.style }}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <span className={cn(
                                      "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                                      task.priority === 'high' ? "bg-red-500/20 text-red-400" :
                                      task.priority === 'medium' ? "bg-amber-500/20 text-amber-400" :
                                      "bg-blue-500/20 text-blue-400"
                                    )}>
                                      {task.priority || "Normal"}
                                    </span>
                                    {isDelayed && column.id !== "done" && (
                                      <span className="flex items-center text-xs text-amber-400 font-medium animate-pulse">
                                        <Clock className="w-3 h-3 mr-1" /> Stuck
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-200 font-medium text-sm mb-4 leading-snug">{task.content}</p>
                                  
                                  <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {task.daysInStage}d
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-xs font-bold text-[#3b82f6] border border-[#3b82f6]/30">
                                      {task.assigned_to?.substring(0, 2).toUpperCase() || "?"}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                      </AnimatePresence>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </GlassCard>
            );
          })}
        </div>
      </DragDropContext>

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
                  <h2 className="text-xl font-space font-bold text-white">Add Task</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4 text-left">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                    <input 
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#00e5cc]"
                      value={newTask.title}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Assignee</label>
                    <input 
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#00e5cc]"
                      value={newTask.assigned_to}
                      onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                      <select 
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#00e5cc]"
                        value={newTask.priority}
                        onChange={e => setNewTask({...newTask, priority: e.target.value})}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Stage</label>
                      <select 
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#00e5cc]"
                        value={newTask.stage_id}
                        onChange={e => setNewTask({...newTask, stage_id: e.target.value})}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Development">In Development</option>
                        <option value="In Testing">In Testing</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                  </div>
                  
                  {error && <p className="text-amber-500 text-sm mt-2">{error}</p>}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-6 bg-gradient-to-r from-[#00e5cc] to-[#3b82f6] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Publish Task"}
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

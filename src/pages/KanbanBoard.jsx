import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GlassCard } from '../components/GlassCard';
import { kanbanColumns, kanbanTasks } from '../data/mockData';
import { Clock, X, Loader } from 'lucide-react';
import { cn } from '../utils/cn';
import { getProjects, getTasksByProject, updateTaskStage, createTask } from '../services/api';
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
    tasks: kanbanTasks,
    columns: kanbanColumns,
    columnOrder: ['todo', 'inDev', 'inTesting', 'done'],
  });
  const [projectId, setProjectId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assignee: '', priority: 'medium', stage: 'To Do' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!projectId) {
      setError("No project loaded — showing demo data");
      return;
    }
    if (!newTask.title.trim() || !newTask.assignee.trim()) {
      setError("Title and Assignee are required");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createTask({ ...newTask, projectId });
      loadRealTasks();
      setTimeout(() => {
        setIsModalOpen(false);
        setNewTask({ title: '', assignee: '', priority: 'medium', stage: 'To Do' });
      }, 500);
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  const loadRealTasks = useCallback(async () => {
    try {
      const projects = await getProjects();
      if (projects.length > 0) {
        setProjectId(projects[0]._id);
        const tasks = await getTasksByProject(projects[0]._id);
        
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
            daysInStage: t.daysInStage,
            assignee: t.assignee
          };
          const colId = STAGE_MAP[t.stage] || 'todo';
          newColumns[colId].taskIds.push(t._id);
        });

        setData({
          tasks: newTasks,
          columns: newColumns,
          columnOrder: ['todo', 'inDev', 'inTesting', 'done']
        });
      }
    } catch (err) {
      console.log('Falling back to mockData:', err);
    }
  }, []);

  useEffect(() => {
    loadRealTasks();
  }, [loadRealTasks]);

  useEffect(() => {
    const handleTaskMoved = () => {
      loadRealTasks();
    };
    socket.on('task:moved', handleTaskMoved);
    return () => {
      socket.off('task:moved', handleTaskMoved);
    };
  }, [loadRealTasks]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

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

    if (projectId && start !== finish) {
      updateTaskStage(draggableId, REVERSE_STAGE_MAP[finish.id]).catch(err => {
        console.error('Failed to update task stage', err);
        loadRealTasks(); // rollback on error
      });
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
          <p className="text-gray-400 mt-1 font-inter">Manage tasks and identify stage bottlenecks.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors font-medium border border-white/5"
        >
          Add Task
        </button>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 min-h-0 flex gap-6 overflow-x-auto pb-4">
          {data.columnOrder.map((columnId) => {
            const column = data.columns[columnId];
            const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

            return (
              <GlassCard key={column.id} className="min-w-[280px] flex flex-col bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-space font-semibold text-lg text-white">{column.title}</h3>
                  <span className="bg-smartops-primary/20 text-smartops-primary text-xs font-bold px-2.5 py-1 rounded-full">
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
                        snapshot.isDraggingOver ? "bg-white/5" : "bg-transparent"
                      )}
                    >
                      <AnimatePresence>
                        {tasks.map((task, index) => {
                          const isDelayed = task.daysInStage > 4;
                          
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    "mb-3 rounded-xl p-4 glass-panel bg-white/5 border border-white/10 transition-shadow",
                                    snapshot.isDragging ? "shadow-2xl scale-[1.02] rotate-1 z-50 border-smartops-primary/30 glow-active" : "",
                                    !snapshot.isDragging && isDelayed ? "glow-amber border-amber-500/30" : ""
                                  )}
                                  style={{
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <span className={cn(
                                      "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                                      task.priority === 'high' ? "bg-red-500/20 text-red-400" :
                                      task.priority === 'medium' ? "bg-amber-500/20 text-amber-400" :
                                      "bg-blue-500/20 text-blue-400"
                                    )}>
                                      {task.priority}
                                    </span>
                                    {isDelayed && (
                                      <span className="flex items-center text-xs text-amber-400 font-medium animate-pulse">
                                        <Clock className="w-3 h-3 mr-1" /> Delayed
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-200 font-medium text-sm mb-4 leading-snug">{task.content}</p>
                                  
                                  <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {task.daysInStage} {task.daysInStage === 1 ? 'day' : 'days'}
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-smartops-primary/20 flex items-center justify-center text-xs font-bold text-smartops-primary border border-smartops-primary/30">
                                      {task.assignee}
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

                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                    <input 
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-smartops-primary"
                      value={newTask.title}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Assignee</label>
                    <input 
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-smartops-primary"
                      value={newTask.assignee}
                      onChange={e => setNewTask({...newTask, assignee: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-smartops-primary [&>option]:bg-gray-800"
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
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-smartops-primary [&>option]:bg-gray-800"
                      value={newTask.stage}
                      onChange={e => setNewTask({...newTask, stage: e.target.value})}
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Development">In Development</option>
                      <option value="In Testing">In Testing</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  
                  {error && <p className="text-amber-500 text-sm">{error}</p>}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full mt-4 bg-smartops-primary text-smartops-bg font-bold py-2 rounded-xl hover:bg-[#00e5cc]/90 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Create Task"}
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

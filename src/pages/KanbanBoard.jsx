import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GlassCard } from '../components/GlassCard';
import { kanbanColumns, kanbanTasks } from '../data/mockData';
import { Clock } from 'lucide-react';
import { cn } from '../utils/cn';

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
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-[calc(100vh-120px)] flex flex-col"
    >
      <header className="mb-6">
        <h1 className="text-3xl font-space font-bold text-white tracking-tight">Active Sprints</h1>
        <p className="text-gray-400 mt-1 font-inter">Manage tasks and identify stage bottlenecks.</p>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {data.columnOrder.map((columnId) => {
            const column = data.columns[columnId];
            const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

            return (
              <GlassCard key={column.id} className="w-[350px] flex-shrink-0 flex flex-col bg-white/[0.02]">
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
    </motion.div>
  );
}

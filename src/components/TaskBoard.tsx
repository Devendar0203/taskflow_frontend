import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DropResult } from 'react-beautiful-dnd';
import { type Task, type TaskStatus, type User } from '../types';
import TaskCard from './TaskCard';

interface Props {
  tasks: Task[];
  members?: User[];
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onAssign?: (taskId: number, userId: number) => void;
  onDelete?: (taskId: number) => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'TO DO' },
  { id: 'IN_PROGRESS', title: 'IN PROGRESS' },
  { id: 'DONE', title: 'DONE' }
];

const TaskBoard: React.FC<Props> = ({ tasks, members, onStatusChange, onAssign, onDelete }) => {
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const draggedTaskId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId as TaskStatus;

    setLocalTasks(prev => prev.map(t => 
      t.id === draggedTaskId ? { ...t, status: newStatus } : t
    ));

    onStatusChange(draggedTaskId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const columnTasks = localTasks.filter(t => t.status === col.id);
          
          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header">
                <span style={{ fontSize: '13px', letterSpacing: '0.5px' }}>{col.title}</span>
                <span style={{ fontSize: '12px', background: '#dfe1e6', color: '#172b4d', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                  {columnTasks.length}
                </span>
              </div>
              
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="kanban-taskList"
                    style={{ 
                      minHeight: 150,
                      background: snapshot.isDraggingOver ? 'rgba(9, 30, 66, 0.05)' : 'transparent',
                      transition: 'background 0.2s ease',
                      borderRadius: '0 0 12px 12px'
                    }}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <TaskCard 
                            task={task} 
                            provided={provided} 
                            snapshot={snapshot}
                            members={members}
                            onAssign={onAssign}
                            onDelete={onDelete}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default TaskBoard;

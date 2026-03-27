import React from 'react';
import { Typography, Avatar, Dropdown, Tooltip, Button } from 'antd';
import type { MenuProps } from 'antd';
import { UserOutlined, DeleteOutlined, ArrowUpOutlined, ArrowRightOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { type Task, type User } from '../types';
import { authService } from '../services/auth.service';

const { Text } = Typography;

interface Props {
  task: Task;
  provided: any;
  snapshot: any;
  members?: User[];
  onAssign?: (taskId: number, userId: number) => void;
  onDelete?: (taskId: number) => void;
}



const priorityIcons: Record<string, React.ReactNode> = {
  LOW: <ArrowDownOutlined style={{ color: '#0052cc' }} />,
  MEDIUM: <ArrowRightOutlined style={{ color: '#ff991f' }} />,
  HIGH: <ArrowUpOutlined style={{ color: '#ff5630' }} />
};

const TaskCard: React.FC<Props> = ({ task, provided, snapshot, members, onAssign, onDelete }) => {
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';
  const assignee = members?.find(m => m.id === task.assignedUserId);
  const assigneeName = assignee ? (assignee.name || assignee.email) : (task.assignedUserId ? String(task.assignedUserId) : null);

  const menuItems: MenuProps['items'] = members?.map(m => ({
    key: m.id.toString(),
    label: m.name || m.email,
    onClick: () => onAssign && onAssign(task.id, m.id)
  })) || [];

  return (
    <div 
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
        padding: '12px 16px',
        marginBottom: '8px',
        background: snapshot.isDragging ? '#e6effc' : '#ffffff',
        border: '1px solid #dfe1e6',
        borderRadius: '3px',
        boxShadow: snapshot.isDragging ? '0 8px 16px rgba(9, 30, 66, 0.15)' : '0 1px 2px rgba(9, 30, 66, 0.1)',
        transition: 'background 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong style={{ fontSize: '14px', color: '#172b4d', lineHeight: 1.4, margin: 0, wordBreak: 'break-word' }}>
          {task.title}
        </Text>
        {onDelete && isAdmin && (
          <Tooltip title="Delete task">
            <Button type="text" danger icon={<DeleteOutlined style={{ fontSize: '12px' }} />} size="small" style={{ opacity: snapshot.isDragging ? 1 : 0.6 }} onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} />
          </Tooltip>
        )}
      </div>
      
      {task.description && (
        <Text type="secondary" style={{ marginBottom: 12, fontSize: '12px', wordBreak: 'break-word', lineHeight: 1.5, color: '#5e6c84', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </Text>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {task.priority && (
            <Tooltip title={`Priority: ${task.priority}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, background: '#f4f5f7', borderRadius: 4 }}>
                {priorityIcons[task.priority]}
              </div>
            </Tooltip>
          )}
          <span style={{ fontSize: '12px', color: '#5e6c84', fontWeight: 500 }}>TSK-{task.id}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {members && onAssign && isAdmin ? (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <div style={{ cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
              <Tooltip title={assigneeName ? `Assigned to ${assigneeName}` : 'Assign task'}>
                <Avatar size={24} style={{ backgroundColor: assigneeName ? '#0052cc' : '#f4f5f7', color: assigneeName ? '#fff' : '#5e6c84', fontSize: '12px' }} icon={!assigneeName && <UserOutlined />}>
                  {assigneeName && assigneeName.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
            </div>
          </Dropdown>
        ) : (
          <Tooltip title={assigneeName ? `Assigned to ${assigneeName}` : 'Unassigned'}>
            <Avatar size={24} style={{ backgroundColor: assigneeName ? '#0052cc' : '#f4f5f7', color: assigneeName ? '#fff' : '#5e6c84', fontSize: '12px' }} icon={!assigneeName && <UserOutlined />}>
              {assigneeName && assigneeName.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
        )}
      </div>
    </div>
    </div>
  );
};

export default TaskCard;

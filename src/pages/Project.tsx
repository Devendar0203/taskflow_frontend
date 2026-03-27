import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, message, Breadcrumb, Avatar, Tooltip, Skeleton, Modal } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, UserAddOutlined, DeleteOutlined } from '@ant-design/icons';
import { taskService } from '../services/task.service';
import { projectService } from '../services/project.service';
import { authService } from '../services/auth.service';
import { type Task, type TaskStatus, type User } from '../types';
import TaskBoard from '../components/TaskBoard';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import AddMemberModal from '../components/modals/AddMemberModal';
import { useThemeContext } from '../context/ThemeContext';

const { Title } = Typography;

const Project: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const user = authService.getCurrentUser();
  const { themeColor } = useThemeContext();

  const fetchTasksAndMembers = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const pId = parseInt(projectId, 10);
      const [taskData, memberData] = await Promise.all([
        taskService.getTasksByProject(pId),
        projectService.getGroupMembers(pId)
      ]);
      setTasks(taskData || []);
      setMembers(memberData || []);
    } catch (error) {
      console.error(error);
      setTasks([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndMembers();
  }, [projectId]);

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await taskService.updateTaskStatus(taskId, newStatus);
    } catch (error) {
      message.error('Failed to update task status');
      fetchTasksAndMembers(); 
    }
  };

  const handleAssign = async (taskId: number, userId: number) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedUserId: userId } : t));
      await taskService.assignTask(taskId, userId);
      message.success('Task assigned!');
    } catch (e) {
      message.error('Failed to assign task');
      fetchTasksAndMembers();
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await taskService.deleteTask(taskId);
      message.success('Task deleted');
    } catch (e) {
      message.error('Failed to delete task');
      fetchTasksAndMembers();
    }
  };

  const handleDeleteProject = () => {
    Modal.confirm({
      title: 'Are you sure you want to delete this project?',
      content: 'This action cannot be undone and will remove all tasks and assignments.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await projectService.deleteProject(Number(projectId));
          message.success('Project deleted successfully');
          navigate('/dashboard');
        } catch (error: any) {
          console.error(error);
          const errMsg = error?.response?.data || error?.message || 'Failed to delete project';
          message.error(typeof errMsg === 'string' ? errMsg : 'Failed to delete project');
        }
      }
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Skeleton active paragraph={{ rows: 1 }} />
        <div style={{ display: 'flex', gap: 16 }}>
          <Skeleton.Button active style={{ width: 320, height: 500 }} />
          <Skeleton.Button active style={{ width: 320, height: 500 }} />
          <Skeleton.Button active style={{ width: 320, height: 500 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb items={[
          { title: <a onClick={() => navigate('/dashboard')} style={{ color: '#5e6c84' }}>Projects</a> },
          { title: <span style={{ color: '#172b4d', fontWeight: 500 }}>Project #{projectId}</span> }
        ]} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')} type="text" style={{ background: '#fff', border: '1px solid #dfe1e6' }} />
          <Title level={3} style={{ margin: 0, color: '#172b4d' }}>Board</Title>
          <div style={{ marginLeft: 24, paddingLeft: 24, borderLeft: '1px solid #dfe1e6', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar.Group maxCount={4} size="small">
              {members.map(m => (
                <Tooltip key={m.id} title={m.name || m.email} placement="top">
                  <Avatar style={{ backgroundColor: themeColor, border: '2px solid #fff' }}>{(m.name || m.email).charAt(0).toUpperCase()}</Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
            {user?.role === 'ADMIN' && (
              <Button type="dashed" size="small" icon={<UserAddOutlined />} onClick={() => setIsAddMemberModalOpen(true)} style={{ borderRadius: 16 }}>Add</Button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {user?.role === 'ADMIN' && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteProject}
            >
              Delete
            </Button>
          )}
          {user?.role === 'ADMIN' && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setIsModalOpen(true)}
              style={{ fontWeight: 600 }}
            >
              Create Task
            </Button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <TaskBoard 
          tasks={user?.role === 'ADMIN' ? tasks : tasks.filter(t => t.assignedUserId === user?.id)} 
          members={members} 
          onStatusChange={handleStatusChange} 
          onAssign={handleAssign} 
          onDelete={handleDeleteTask} 
        />
      </div>

      <CreateTaskModal 
        open={isModalOpen}
        groupId={Number(projectId)}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasksAndMembers}
      />
      <AddMemberModal
        open={isAddMemberModalOpen}
        groupId={Number(projectId)}
        currentMembers={members}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSuccess={fetchTasksAndMembers}
      />
    </div>
  );
};

export default Project;

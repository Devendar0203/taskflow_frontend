import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Button, Empty, List, Checkbox, Tag, Input, Select, Skeleton, message, Dropdown } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined, ArrowUpOutlined, ArrowRightOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { taskService } from '../services/task.service';
import { type Task, type TaskStatus } from '../types';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

const priorityIcons: Record<string, React.ReactNode> = {
  LOW: <ArrowDownOutlined style={{ color: '#0052cc' }} />,
  MEDIUM: <ArrowRightOutlined style={{ color: '#ff991f' }} />,
  HIGH: <ArrowUpOutlined style={{ color: '#ff5630' }} />
};

const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getMyTasks();
      setTasks(data || []);
    } catch (error) {
      console.error(error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await taskService.updateTaskStatus(taskId, newStatus);
      message.success('Task status updated');
    } catch (error) {
      message.error('Failed to update task status');
      fetchTasks();
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await taskService.deleteTask(taskId);
      message.success('Task deleted');
    } catch (error) {
      message.error('Failed to delete task');
      fetchTasks();
    }
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (statusFilter !== 'ALL') result = result.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'ALL') result = result.filter(t => t.priority === priorityFilter);
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(lowerSearch) || t.description?.toLowerCase().includes(lowerSearch));
    }
    return result.sort((a, b) => (priorityWeight[b.priority || 'MEDIUM'] || 0) - (priorityWeight[a.priority || 'MEDIUM'] || 0));
  }, [tasks, statusFilter, priorityFilter, searchText]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#172b4d' }}>All Tasks</Title>
          <Text type="secondary" style={{ color: '#5e6c84' }}>Manage your personal task list across all projects</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalOpen(true)}
          style={{ fontWeight: 600 }}
          size="large"
        >
          Create Task
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <Input 
          placeholder="Search tasks..." 
          prefix={<SearchOutlined style={{ color: '#5e6c84' }} />} 
          style={{ flex: 1, minWidth: 250, border: '1px solid #dfe1e6' }} 
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Select 
          value={statusFilter} 
          onChange={setStatusFilter} 
          style={{ width: 150 }} 
          options={[
            { value: 'ALL', label: 'All Status' },
            { value: 'TODO', label: 'To Do' },
            { value: 'IN_PROGRESS', label: 'In Progress' },
            { value: 'DONE', label: 'Done' }
          ]} 
        />
        <Select 
          value={priorityFilter} 
          onChange={setPriorityFilter} 
          style={{ width: 150 }} 
          options={[
            { value: 'ALL', label: 'All Priority' },
            { value: 'HIGH', label: 'High' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'LOW', label: 'Low' }
          ]} 
        />
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
           <div style={{ background: '#fff', border: '1px solid #dfe1e6', borderRadius: 8, padding: 24 }}>
             {[1, 2, 3].map(i => (
               <Skeleton key={i} active avatar paragraph={{ rows: 1 }} style={{ marginBottom: 24 }} />
             ))}
           </div>
        ) : filteredTasks.length === 0 ? (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
             <Empty description={<span style={{ color: '#5e6c84' }}>No tasks found</span>} style={{ padding: '64px', margin: '40px 0', border: '1px dashed #dfe1e6', borderRadius: 8, background: '#fff' }} />
           </motion.div>
        ) : (
           <List
             style={{ background: '#fff', border: '1px solid #dfe1e6', borderRadius: 8 }}
             itemLayout="horizontal"
             dataSource={filteredTasks}
             renderItem={(task) => (
               <List.Item
                 style={{ padding: '20px 24px', borderBottom: '1px solid #dfe1e6', transition: 'background 0.2s', ...((task.status === 'DONE') ? { background: '#f4f5f7', opacity: 0.8 } : {}) }}
                 actions={[
                    task.priority && (
                      <div key="priority" style={{ display: 'flex', alignItems: 'center', background: '#f4f5f7', padding: '4px 8px', borderRadius: 4, border: '1px solid #dfe1e6' }}>
                        {priorityIcons[task.priority]}
                        <span style={{ fontSize: '12px', marginLeft: 6, color: '#172b4d', fontWeight: 500 }}>{task.priority}</span>
                      </div>
                    ),
                    <Dropdown
                      key="status"
                      trigger={['click']}
                      menu={{
                        onClick: ({ key }: any) => handleStatusChange(task.id, key as TaskStatus),
                        items: [
                          { key: 'TODO', label: 'To Do' },
                          { key: 'IN_PROGRESS', label: 'In Progress' },
                          { key: 'DONE', label: 'Done' }
                        ]
                      }}
                    >
                      <Tag color={
                        task.status === 'DONE' ? 'green' : 
                        task.status === 'IN_PROGRESS' ? 'blue' : 'default'
                      } style={{ fontWeight: 600, padding: '4px 10px', margin: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {task.status.replace('_', ' ')} <span style={{ fontSize: '10px' }}>▼</span>
                      </Tag>
                    </Dropdown>,
                    <Button key="delete" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(task.id)} />
                 ]}
               >
                 <List.Item.Meta
                   avatar={
                     <Checkbox 
                       checked={task.status === 'DONE'} 
                       onChange={(e) => handleStatusChange(task.id, e.target.checked ? 'DONE' : 'TODO')} 
                       style={{ transform: 'scale(1.2)', marginTop: 4 }}
                     />
                   }
                   title={<span style={{ 
                     textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
                     color: task.status === 'DONE' ? '#5e6c84' : '#172b4d',
                     fontSize: '15px',
                     fontWeight: 600
                   }}>{task.title}</span>}
                   description={<span style={{ color: '#5e6c84', fontSize: '13px', display: 'block', marginTop: 4 }}>{task.description || 'No description'}</span>}
                 />
               </List.Item>
             )}
           />
        )}
      </div>

      <CreateTaskModal 
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasks}
      />
    </div>
  );
};

export default MyTasks;

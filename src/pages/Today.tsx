import React, { useEffect, useState } from 'react';
import { Typography, Checkbox, List, Skeleton } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { taskService } from '../services/task.service';
import { type Task } from '../types';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import { useThemeContext } from '../context/ThemeContext';

const { Title, Text } = Typography;

const Today: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { themeColor } = useThemeContext();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getMyTasks();
      setTasks(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId: number, checked: boolean) => {
    try {
      const newStatus = checked ? 'DONE' : 'TODO';
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await taskService.updateTaskStatus(taskId, newStatus);
    } catch (e) {
      fetchTasks();
    }
  };

  const todayString = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.status !== 'DONE' && t.dueDate && t.dueDate.split('T')[0] < todayString);
  const todayTasks = tasks.filter(t => t.status !== 'DONE' && t.dueDate?.split('T')[0] === todayString);

  const renderTaskList = (list: Task[]) => (
    <List
      dataSource={list}
      renderItem={(task, index) => (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
          layout
        >
          <List.Item
            style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', gap: 12 }}
          >
            <Checkbox
              checked={task.status === 'DONE'}
              onChange={e => handleStatusChange(task.id, e.target.checked)}
              style={{ marginTop: 2, transform: 'scale(1.1)' }}
            />
            <div style={{ flex: 1 }}>
              <Text style={{ fontSize: '14px', color: '#1f1f1f', lineHeight: 1.5 }}>{task.title}</Text>
              {task.description && (
                <div style={{ fontSize: '12px', color: '#808080', marginTop: 2 }}>{task.description}</div>
              )}
              <div style={{ fontSize: '12px', color: '#058527', marginTop: 4 }}>
                Inbox
              </div>
            </div>
          </List.Item>
        </motion.div>
      )}
    />
  );

  return (
    <div style={{ width: '100%', padding: '0px 24px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: '24px' }}>Today Tasks</Title>
        <Text type="secondary" style={{ fontSize: '12px' }}>{tasks.filter(t => t.status !== 'DONE').length} tasks</Text>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : tasks.filter(t => t.status !== 'DONE').length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 100 }}>
          <img src="https://todoist.b-cdn.net/assets/images/f1725fb635bc73adcc6ff48c0882e3db.png" alt="All done" style={{ width: 220, marginBottom: 24, opacity: 0.8 }} />
          <div><Text strong style={{ fontSize: '16px' }}>You're all done for today!</Text></div>
          <Text type="secondary">Enjoy the rest of your day.</Text>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Overdue Section (If any) */}
          {overdueTasks.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 8 }}>
                <Text strong style={{ fontSize: '14px' }}>Overdue</Text>
                <Text style={{ fontSize: '13px', color: themeColor, cursor: 'pointer' }}>Reschedule</Text>
              </div>
              {renderTaskList(overdueTasks)}
            </div>
          )}

          {/* Today Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 8 }}>
              <Text strong style={{ fontSize: '14px' }}>
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · Today · {new Date().toLocaleDateString('en-GB', { weekday: 'long' })}
              </Text>
            </div>
            {renderTaskList(todayTasks)}

            <div
              style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', color: themeColor, marginTop: 8 }}
              className="sidebar-hover-item"
              onClick={() => setIsModalOpen(true)}
            >
              <PlusOutlined /> Add task
            </div>
          </div>
        </div>
      )}

      <CreateTaskModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchTasks} />
    </div>
  );
};

export default Today;

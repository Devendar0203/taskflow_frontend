import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Checkbox, Skeleton, Empty, Tag, Select, Input } from 'antd';
import {
  CheckCircleFilled,
  SearchOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { taskService } from '../services/task.service';
import { type Task } from '../types';

const { Title, Text } = Typography;

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: '#ff4d4f',
  MEDIUM: '#fa8c16',
  LOW: '#52c41a',
};

const Completed: React.FC = () => {
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [sortBy, setSortBy]   = useState<'date' | 'priority'>('date');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getMyTasks();
      setTasks((data || []).filter((t: Task) => t.status === 'DONE'));
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleUndo = async (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await taskService.updateTaskStatus(id, 'TODO');
    } catch {
      fetchTasks();
    }
  };

  // Filter by search
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter(t =>
      !q || t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
    );
  }, [tasks, search]);

  // Sort
  const sorted = useMemo(() => {
    if (sortBy === 'priority') {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return [...filtered].sort((a, b) =>
        (order[a.priority ?? 'LOW'] ?? 3) - (order[b.priority ?? 'LOW'] ?? 3)
      );
    }
    // Sort by dueDate desc
    return [...filtered].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return b.dueDate.localeCompare(a.dueDate);
    });
  }, [filtered, sortBy]);

  // Group by due date label
  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    const todayStr     = dayjs().format('YYYY-MM-DD');
    const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

    sorted.forEach(t => {
      let label = 'No Due Date';
      if (t.dueDate) {
        const d = t.dueDate.split('T')[0];
        if (d === todayStr)      label = 'Today';
        else if (d === yesterdayStr) label = 'Yesterday';
        else                     label = dayjs(d).format('ddd, MMM D');
      }
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(t);
    });
    return map;
  }, [sorted]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', padding: '32px 16px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <CheckCircleFilled style={{ fontSize: 24, color: '#52c41a' }} />
        <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: 24 }}>Completed</Title>
        <Tag style={{ marginLeft: 4, borderRadius: 20, fontSize: 12 }}>{tasks.length} tasks</Tag>
      </div>
      <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 24 }}>
        All tasks you've completed. Uncheck to move back to Todo.
      </Text>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          placeholder="Search completed tasks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, borderRadius: 8 }}
          allowClear
        />
        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ width: 160 }}
          options={[
            { value: 'date',     label: '📅 Sort by Date' },
            { value: 'priority', label: '🔥 Sort by Priority' },
          ]}
        />
      </div>

      {/* Content */}
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : sorted.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={search ? 'No completed tasks match your search.' : 'No completed tasks yet. Complete a task and it will appear here!'}
        />
      ) : (
        <AnimatePresence>
          {Array.from(groups.entries()).map(([label, groupTasks]) => (
            <div key={label} style={{ marginBottom: 32 }}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 4 }}>
                <CalendarOutlined style={{ color: '#bbb', fontSize: 13 }} />
                <Text strong style={{ fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {label}
                </Text>
                <Text style={{ fontSize: 11, color: '#ccc', marginLeft: 'auto' }}>
                  {groupTasks.length} {groupTasks.length === 1 ? 'task' : 'tasks'}
                </Text>
              </div>

              {/* Tasks */}
              {groupTasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18, delay: idx * 0.03 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: '#fafafa',
                      border: '1px solid #f0f0f0',
                      marginBottom: 6,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fafafa')}
                  >
                    <Checkbox
                      checked
                      onChange={() => handleUndo(task.id)}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#aaa',
                          textDecoration: 'line-through',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text style={{ fontSize: 12, color: '#ccc', display: 'block', marginTop: 2 }}>
                          {task.description}
                        </Text>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                        {task.priority && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLOR[task.priority] }}>
                            ● {task.priority}
                          </span>
                        )}
                        {task.startTime && task.endTime && (
                          <span style={{ fontSize: 11, color: '#bbb', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ClockCircleOutlined style={{ fontSize: 10 }} />
                            {task.startTime} – {task.endTime}
                          </span>
                        )}
                        {task.dueDate && (
                          <span style={{ fontSize: 11, color: '#bbb' }}>
                            Due {dayjs(task.dueDate).format('MMM D')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Text
                      onClick={() => handleUndo(task.id)}
                      style={{ fontSize: 11, color: '#bbb', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
                      className="sidebar-hover-item"
                    >
                      Undo
                    </Text>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Completed;

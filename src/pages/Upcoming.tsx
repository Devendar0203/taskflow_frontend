import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Checkbox, Skeleton, Tag, Empty } from 'antd';
import { PlusOutlined, LeftOutlined, RightOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { taskService } from '../services/task.service';
import { type Task } from '../types';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import { useThemeContext } from '../context/ThemeContext';

dayjs.extend(isSameOrAfter);

const { Title, Text } = Typography;

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: '#ff4d4f', MEDIUM: '#fa8c16', LOW: '#52c41a',
};

const Upcoming: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(dayjs());
  const { themeColor } = useThemeContext();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getMyTasks();
      setTasks(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleStatusChange = async (taskId: number, checked: boolean) => {
    const newStatus = checked ? 'DONE' : 'TODO';
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try { await taskService.updateTaskStatus(taskId, newStatus); }
    catch { fetchTasks(); }
  };

  const todayStr = dayjs().format('YYYY-MM-DD');
  const tomorrowStr = dayjs().add(1, 'day').format('YYYY-MM-DD');

  // Generate 7 quick-nav date pills
  const timelineDates = useMemo(() =>
    Array.from({ length: 7 }).map((_, i) => startDate.add(i, 'day')),
    [startDate]
  );

  // Overdue: past + not done
  const overdueTasks = useMemo(() =>
    tasks.filter(t => t.status !== 'DONE' && t.dueDate && t.dueDate.split('T')[0] < todayStr),
    [tasks, todayStr]
  );

  // Future tasks: today onward + not done, sorted by date
  const futureTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'DONE' && t.dueDate && t.dueDate.split('T')[0] >= todayStr)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
  }, [tasks, todayStr]);

  // No-date tasks: active but no due date
  const noDatTasks = useMemo(() =>
    tasks.filter(t => t.status !== 'DONE' && !t.dueDate),
    [tasks]
  );

  // Group future tasks by date
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    futureTasks.forEach(t => {
      const d = t.dueDate!.split('T')[0];
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(t);
    });
    return map;
  }, [futureTasks]);

  const scrollToDate = (dateStr: string) => {
    const el = document.getElementById(`date-section-${dateStr}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const renderTaskRow = (task: Task) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.18 }}
      layout
    >
      <div
        style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'flex-start', gap: 12 }}
      >
        <Checkbox
          checked={task.status === 'DONE'}
          onChange={e => handleStatusChange(task.id, e.target.checked)}
          style={{ marginTop: 3, transform: 'scale(1.1)', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, color: task.status === 'DONE' ? '#bbb' : '#1f1f1f', lineHeight: 1.5, display: 'block', textDecoration: task.status === 'DONE' ? 'line-through' : 'none' }}>
            {task.title}
          </Text>
          {task.description && (
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{task.description}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            {task.priority && (
              <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLOR[task.priority] }}>
                ● {task.priority}
              </span>
            )}
            {task.startTime && task.endTime && (
              <span style={{ fontSize: 11, color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ClockCircleOutlined style={{ fontSize: 10 }} />
                {task.startTime} – {task.endTime}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={{ width: '100%', padding: '0px 24px 100px' }}>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: 24 }}>Upcoming Tasks</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {futureTasks.length > 0 && (
            <Tag style={{ borderRadius: 20, fontSize: 12 }}>{futureTasks.length} upcoming</Tag>
          )}
          {overdueTasks.length > 0 && (
            <Tag color="red" style={{ borderRadius: 20, fontSize: 12 }}>
              <ExclamationCircleOutlined style={{ marginRight: 4 }} />{overdueTasks.length} overdue
            </Tag>
          )}
        </div>
      </div>

      {/* ── Sticky nav: month picker + week arrows ───────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', paddingTop: 8, paddingBottom: 12, borderBottom: '1px solid #f0f0f0', marginBottom: 20 }}>
        {/* Month + nav row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text strong style={{ fontSize: 16, color: '#1f1f1f' }}>
            {startDate.format('MMMM YYYY')}
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LeftOutlined
              style={{ color: '#888', cursor: 'pointer', padding: 4 }}
              onClick={() => setStartDate(prev => prev.subtract(7, 'day'))}
            />
            <Text
              strong
              style={{ fontSize: 12, cursor: 'pointer', color: themeColor }}
              onClick={() => setStartDate(dayjs())}
            >
              Today
            </Text>
            <RightOutlined
              style={{ color: '#888', cursor: 'pointer', padding: 4 }}
              onClick={() => setStartDate(prev => prev.add(7, 'day'))}
            />
          </div>
        </div>

        {/* 7-day quick-nav pills */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
          {timelineDates.map(date => {
            const ds = date.format('YYYY-MM-DD');
            const isToday = ds === todayStr;
            const taskCount = (grouped.get(ds) || []).length;
            return (
              <div
                key={ds}
                onClick={() => scrollToDate(ds)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 4, cursor: 'pointer', padding: '6px 4px', borderRadius: 10,
                  background: isToday ? '#fff5f5' : '#fafafa',
                  border: `1.5px solid ${isToday ? '#ffccc7' : '#f0f0f0'}`,
                  transition: 'all 0.15s',
                }}
                className="sidebar-hover-item"
              >
                <Text style={{ fontSize: 10, fontWeight: 700, color: isToday ? themeColor : '#bbb', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {date.format('ddd')}
                </Text>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: isToday ? themeColor : 'transparent',
                  color: isToday ? '#fff' : '#1f1f1f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: isToday ? 700 : 400,
                }}>
                  {date.format('D')}
                </div>
                {taskCount > 0 && (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: isToday ? themeColor : '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: isToday ? '#fff' : '#888' }}>{taskCount}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Overdue section */}
          {overdueTasks.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #ff4d4f', paddingBottom: 8, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                  <Text strong style={{ fontSize: 14, color: '#ff4d4f' }}>Overdue</Text>
                </div>
                <Text style={{ fontSize: 12, color: '#ff4d4f', cursor: 'pointer' }}>Reschedule</Text>
              </div>
              <AnimatePresence>
                {overdueTasks.map(t => renderTaskRow(t))}
              </AnimatePresence>
            </div>
          )}

          {/* Future tasks grouped by date */}
          {grouped.size === 0 && overdueTasks.length === 0 && noDatTasks.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No upcoming tasks. Add tasks with future due dates to see them here!"
            />
          ) : (
            Array.from(grouped.entries()).map(([dateStr, dateTasks]) => {
              const d = dayjs(dateStr);
              const isToday = dateStr === todayStr;
              const isTomorrow = dateStr === tomorrowStr;

              let label = d.format('D MMM · dddd');
              if (isToday) label = `${d.format('D MMM')} · Today · ${d.format('dddd')}`;
              if (isTomorrow) label = `${d.format('D MMM')} · Tomorrow · ${d.format('dddd')}`;

              return (
                <div key={dateStr} id={`date-section-${dateStr}`} style={{ scrollMarginTop: 120 }}>
                  {/* Date header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${isToday ? '#ffccc7' : '#f0f0f0'}`, paddingBottom: 8, marginBottom: 6 }}>
                    <Text strong style={{ fontSize: 14, color: isToday ? themeColor : '#1f1f1f' }}>
                      {label}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#bbb' }}>
                      {dateTasks.length} {dateTasks.length === 1 ? 'task' : 'tasks'}
                    </Text>
                  </div>

                  {/* Tasks */}
                  <AnimatePresence>
                    {dateTasks.map(t => renderTaskRow(t))}
                  </AnimatePresence>

                  {/* Add task inline */}
                  <div
                    onClick={() => setIsModalOpen(true)}
                    style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: themeColor, marginTop: 4 }}
                    className="sidebar-hover-item"
                  >
                    <PlusOutlined /> Add task
                  </div>
                </div>
              );
            })
          )}

          {/* Tasks with no due date */}
          {noDatTasks.length > 0 && (
            <div>
              <div style={{ borderBottom: '1px dashed #f0f0f0', paddingBottom: 8, marginBottom: 10 }}>
                <Text strong style={{ fontSize: 13, color: '#bbb' }}>No due date</Text>
              </div>
              <AnimatePresence>
                {noDatTasks.map(t => renderTaskRow(t))}
              </AnimatePresence>
            </div>
          )}

        </div>
      )}

      <CreateTaskModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchTasks} />
    </div>
  );
};

export default Upcoming;

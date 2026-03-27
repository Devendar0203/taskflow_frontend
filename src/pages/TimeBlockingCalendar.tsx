import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Typography, Spin, Collapse, Checkbox, Empty, Badge } from 'antd';
import {
  LeftOutlined, RightOutlined, TagsOutlined, CalendarOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { taskService } from '../services/task.service';
import { type Task } from '../types';
import { useThemeContext } from '../context/ThemeContext';

dayjs.extend(isoWeek);

const { Text, Title } = Typography;

// ── Constants ──────────────────────────────────────────────────────────────────
const HOUR_H = 64;   // px per hour slot
const START_H = 0;    // 12 AM (midnight)
const END_H = 24;   // 12 AM next day
const HOURS = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);
const GUTTER_W = 52;   // left time bar width (px)

// ── Palettes ───────────────────────────────────────────────────────────────────
const PALETTES = [
  { bg: '#e6f7ff', border: '#91caff', text: '#003eb3', accent: '#1677ff' },
  { bg: '#f6ffed', border: '#b7eb8f', text: '#237804', accent: '#52c41a' },
  { bg: '#fff7e6', border: '#ffd591', text: '#874d00', accent: '#fa8c16' },
  { bg: '#f9f0ff', border: '#d3adf7', text: '#391085', accent: '#722ed1' },
  { bg: '#fff0f6', border: '#ffadd2', text: '#9e1068', accent: '#eb2f96' },
  { bg: '#e6fffb', border: '#87e8de', text: '#006d75', accent: '#13c2c2' },
  { bg: '#fff1f0', border: '#ffccc7', text: '#820014', accent: '#ff4d4f' },
];
const getPalette = (i: number) => PALETTES[i % PALETTES.length];

const PRIORITY_COLOR: Record<string, string> = { HIGH: '#ff4d4f', MEDIUM: '#fa8c16', LOW: '#52c41a' };

// Real filter options
const PRIORITY_FILTERS = [
  { label: 'High', value: 'HIGH', bg: '#fff1f0', text: '#cf1322', tag: '#ff4d4f' },
  { label: 'Medium', value: 'MEDIUM', bg: '#fff7e6', text: '#d46b08', tag: '#fa8c16' },
  { label: 'Low', value: 'LOW', bg: '#f6ffed', text: '#389e0d', tag: '#52c41a' },
];
const STATUS_FILTERS = [
  { label: 'Todo', value: 'TODO', bg: '#f5f5f5', text: '#555', tag: '#888' },
  { label: 'In Progress', value: 'IN_PROGRESS', bg: '#e6f7ff', text: '#0958d9', tag: '#1677ff' },
  { label: 'Done', value: 'DONE', bg: '#f6ffed', text: '#389e0d', tag: '#52c41a' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseDateStr(d: string) { return d.split('T')[0]; }

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTop(mins: number): number {
  return ((mins - START_H * 60) / 60) * HOUR_H;
}
function minutesToHeight(startMins: number, endMins: number): number {
  return ((endMins - startMins) / 60) * HOUR_H;
}

function tasksForDay(tasks: Task[], dateStr: string) {
  return tasks.filter(t => t.dueDate && parseDateStr(t.dueDate) === dateStr);
}

/**
 * Resolve timed info for a task:
 * 1. Explicit startTime + endTime fields (set from CreateTaskModal)
 * 2. dueDate with a real time component (not T23:59:59 or midnight)
 * 3. null = all-day / no time
 */
function getTaskTiming(task: Task): { start: string; end: string } | null {
  // Prefer explicit time fields
  if (task.startTime && task.endTime) {
    return { start: task.startTime, end: task.endTime };
  }
  // Try extracting time from dueDate
  if (task.dueDate && task.dueDate.includes('T')) {
    const timePart = task.dueDate.split('T')[1]?.substring(0, 5); // "HH:mm"
    if (timePart && timePart !== '23:59' && timePart !== '00:00') {
      // Use a 1-hour block starting at that time
      const [h, m] = timePart.split(':').map(Number);
      const endH = Math.min(h + 1, 23);
      const end = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      return { start: timePart, end };
    }
  }
  return null;
}

// ── Timed Task Block (placed on time grid) ─────────────────────────────────────
interface TimedBlockProps { task: Task; paletteIdx: number; colCount: number; colIdx: number; startT: string; endT: string; }

const TimedBlock: React.FC<TimedBlockProps> = ({ task, paletteIdx, colCount, colIdx, startT, endT }) => {
  const [hover, setHover] = useState(false);
  const p = getPalette(paletteIdx);

  const startMins = timeToMinutes(startT);
  const endMins = timeToMinutes(endT);
  const top = minutesToTop(Math.max(startMins, START_H * 60));
  const height = Math.max(minutesToHeight(startMins, endMins), 24);

  const colW = 100 / colCount;
  const left = `${colIdx * colW}%`;
  const width = `calc(${colW}% - 3px)`;

  return (
    <div
      style={{ position: 'absolute', top, left, width, height, zIndex: hover ? 20 : 5 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{
        height: '100%', background: p.bg,
        border: `1.5px solid ${p.border}`, borderLeft: `3px solid ${p.accent}`,
        borderRadius: 6, padding: '4px 6px', overflow: 'hidden', cursor: 'default',
        boxShadow: hover ? '0 4px 14px rgba(0,0,0,0.14)' : '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.15s',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: p.accent, fontVariantNumeric: 'tabular-nums' }}>
          {startT} – {endT}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: p.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
          {task.title}
        </div>
        {task.priority && height >= 42 && (
          <div style={{ fontSize: 10, color: PRIORITY_COLOR[task.priority], marginTop: 2 }}>{task.priority}</div>
        )}
      </div>
    </div>
  );
};

// ── Chip (all-day / no time) ───────────────────────────────────────────────────
interface ChipProps { task: Task; paletteIdx: number; onToggle: (id: number, done: boolean) => void; }

const TaskChip: React.FC<ChipProps> = ({ task, paletteIdx, onToggle }) => {
  const p = getPalette(paletteIdx);
  const isDone = task.status === 'DONE';
  const isOverdue = task.dueDate && parseDateStr(task.dueDate) < dayjs().format('YYYY-MM-DD') && !isDone;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 8px', borderRadius: 6, marginBottom: 4,
      background: isDone ? '#fafafa' : p.bg,
      border: `1px solid ${isDone ? '#f0f0f0' : p.border}`,
      borderLeft: `3px solid ${isDone ? '#d9d9d9' : p.accent}`,
    }}>
      <Checkbox checked={isDone} onChange={e => onToggle(task.id, e.target.checked)} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text style={{
          fontSize: 11, fontWeight: 600, color: isDone ? '#bbb' : p.text,
          textDecoration: isDone ? 'line-through' : 'none',
          display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </Text>
        <div style={{ display: 'flex', gap: 6, marginTop: 1, flexWrap: 'wrap' }}>
          {task.priority && (
            <span style={{ fontSize: 9, fontWeight: 700, color: PRIORITY_COLOR[task.priority] }}>
              {task.priority[0]}
            </span>
          )}
          {isOverdue && (
            <span style={{ fontSize: 9, color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: 2 }}>
              <ExclamationCircleOutlined style={{ fontSize: 9 }} /> Overdue
            </span>
          )}
          {task.startTime && (
            <span style={{ fontSize: 9, color: '#bbb', display: 'flex', alignItems: 'center', gap: 2 }}>
              <ClockCircleOutlined style={{ fontSize: 8 }} />{task.startTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Filter Chip ────────────────────────────────────────────────────────────────
interface FilterChipProps { label: string; count?: number; active: boolean; bg: string; text: string; tag: string; onClick: () => void; }

const FilterChip: React.FC<FilterChipProps> = ({ label, count, active, bg, text, tag, onClick }) => (
  <div onClick={onClick} style={{
    cursor: 'pointer', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 500,
    background: active ? tag : bg, color: active ? '#fff' : text,
    border: `1px solid ${active ? tag : 'transparent'}`,
    display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none', flexShrink: 0, transition: 'all 0.15s',
  }}>
    {label}
    {count !== undefined && (
      <span style={{ background: active ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.08)', borderRadius: 10, padding: '1px 6px', fontWeight: 700, fontSize: 10 }}>
        {count}
      </span>
    )}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const TimeBlockingCalendar: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { themeColor } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Dayjs>(dayjs().startOf('isoWeek'));
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try { setTasks((await taskService.getMyTasks()) || []); }
    catch { setTasks([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleToggle = async (id: number, done: boolean) => {
    const s = done ? 'DONE' : 'TODO';
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: s } : t));
    try { await taskService.updateTaskStatus(id, s); }
    catch { fetchTasks(); }
  };

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')), [weekStart]);
  const todayStr = dayjs().format('YYYY-MM-DD');
  const weekLabel = `${weekStart.format('MMM D')} – ${weekStart.add(6, 'day').format('MMM D, YYYY')}`;
  const weekStrings = useMemo(() => weekDays.map(d => d.format('YYYY-MM-DD')), [weekDays]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!activeFilter) return tasks;
    const pf = PRIORITY_FILTERS.find(f => f.value === activeFilter);
    if (pf) return tasks.filter(t => t.priority === pf.value);
    const sf = STATUS_FILTERS.find(f => f.value === activeFilter);
    if (sf) return tasks.filter(t => t.status === sf.value);
    return tasks;
  }, [tasks, activeFilter]);

  const unscheduled = useMemo(() => filteredTasks.filter(t => !t.dueDate), [filteredTasks]);

  const priorityCounts = useMemo(() => ({
    HIGH: tasks.filter(t => t.priority === 'HIGH').length,
    MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
    LOW: tasks.filter(t => t.priority === 'LOW').length,
  }), [tasks]);

  const statusCounts = useMemo(() => ({
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    DONE: tasks.filter(t => t.status === 'DONE').length,
  }), [tasks]);

  // Navigate to a date: switch week if needed, then scroll column into view
  const navigateToDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    const d = dayjs(dateStr);
    const ws = d.startOf('isoWeek');
    // If not in current week, switch
    if (!weekStrings.includes(dateStr)) {
      setWeekStart(ws);
    }
    // Scroll
    setTimeout(() => {
      const el = dayRefs.current[dateStr];
      if (el && scrollRef.current) {
        scrollRef.current.scrollLeft = el.offsetLeft - GUTTER_W;
      }
    }, 50);
  };

  // Current-hour marker top
  const nowTop = useMemo(() => {
    const now = dayjs();
    const mins = now.hour() * 60 + now.minute();
    if (mins < START_H * 60 || mins > END_H * 60) return null;
    return minutesToTop(mins);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: 'Inter, -apple-system, sans-serif', overflow: 'hidden' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0px 24px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ fontSize: 18, color: themeColor }} />
            <Title level={3} style={{ margin: 0, fontWeight: 700, fontSize: 20 }}>Filters &amp; Labels</Title>
          </div>

          {/* Week nav */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <button onClick={() => setWeekStart(w => w.subtract(1, 'week'))}
              style={{ border: 'none', background: '#fff', padding: '6px 12px', cursor: 'pointer', borderRight: '1px solid #e8e8e8', color: '#555' }}>
              <LeftOutlined />
            </button>
            <button onClick={() => { setWeekStart(dayjs().startOf('isoWeek')); setSelectedDate(todayStr); }}
              style={{ border: 'none', background: '#fff', padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#333', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CalendarOutlined style={{ color: themeColor }} />
              {weekLabel}
            </button>
            <button onClick={() => setWeekStart(w => w.add(1, 'week'))}
              style={{ border: 'none', background: '#fff', padding: '6px 12px', cursor: 'pointer', borderLeft: '1px solid #e8e8e8', color: '#555' }}>
              <RightOutlined />
            </button>
          </div>
        </div>

        {/* ── Clickable Date Pills ────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 4, paddingBottom: 10, overflowX: 'auto' }}>
          {weekDays.map(day => {
            const ds = day.format('YYYY-MM-DD');
            const isToday = ds === todayStr;
            const isSel = ds === selectedDate;
            const cnt = tasksForDay(filteredTasks, ds).length;
            return (
              <div
                key={ds}
                onClick={() => navigateToDate(ds)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '6px 10px', borderRadius: 10, cursor: 'pointer', flexShrink: 0, minWidth: 52,
                  background: isSel ? themeColor : isToday ? '#fff5f5' : 'transparent',
                  border: `1.5px solid ${isSel ? themeColor : isToday ? '#ffccc7' : '#f0f0f0'}`,
                  transition: 'all 0.15s',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: 700, color: isSel ? '#fff' : isToday ? themeColor : '#aaa', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {day.format('ddd')}
                </Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: isSel ? '#fff' : isToday ? themeColor : '#1f1f1f', lineHeight: 1.3 }}>
                  {day.format('D')}
                </div>
                {cnt > 0 && (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.3)' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: isSel ? '#fff' : '#888' }}>{cnt}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Filter chips ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 10, overflowX: 'auto', flexWrap: 'nowrap' }}>
          <TagsOutlined style={{ color: '#bbb', flexShrink: 0, fontSize: 12 }} />
          <Text style={{ fontSize: 10, fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>Priority</Text>
          <FilterChip label="All" count={tasks.length} active={!activeFilter} bg="#f5f5f5" text="#555" tag="#1f1f1f" onClick={() => setActiveFilter(null)} />
          {PRIORITY_FILTERS.map(pf => (
            <FilterChip key={pf.value} label={pf.label} count={priorityCounts[pf.value as keyof typeof priorityCounts]}
              active={activeFilter === pf.value} bg={pf.bg} text={pf.text} tag={pf.tag}
              onClick={() => setActiveFilter(activeFilter === pf.value ? null : pf.value)} />
          ))}
          <div style={{ width: 1, height: 16, background: '#e8e8e8', flexShrink: 0, margin: '0 2px' }} />
          <Text style={{ fontSize: 10, fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>Status</Text>
          {STATUS_FILTERS.map(sf => (
            <FilterChip key={sf.value} label={sf.label} count={statusCounts[sf.value as keyof typeof statusCounts]}
              active={activeFilter === sf.value} bg={sf.bg} text={sf.text} tag={sf.tag}
              onClick={() => setActiveFilter(activeFilter === sf.value ? null : sf.value)} />
          ))}
        </div>
      </div>

      {/* ── Calendar ────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            <div style={{ display: 'flex', minWidth: `${GUTTER_W + weekDays.length * 120}px` }}>

              {/* ── Left time gutter ─────────────────────────────────── */}
              <div style={{ width: GUTTER_W, flexShrink: 0, borderRight: '1px solid #f0f0f0', background: '#fafafa', position: 'sticky', left: 0, zIndex: 12 }}>
                {/* Header spacer */}
                <div style={{ height: 40, borderBottom: '1px solid #f0f0f0' }} />
                {/* Hour labels */}
                {HOURS.map(h => (
                  <div key={h} style={{ height: HOUR_H, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 4, fontSize: 10, color: '#c0c0c0', fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* ── Day columns ──────────────────────────────────────── */}
              {weekDays.map((day, dayIdx) => {
                const dateStr = day.format('YYYY-MM-DD');
                const isToday = dateStr === todayStr;
                const isSel = dateStr === selectedDate;
                const dayTasks = tasksForDay(filteredTasks, dateStr);

                // Split using getTaskTiming()
                const timedEntries: { task: Task; timing: { start: string; end: string } }[] = [];
                const chipTasks: Task[] = [];

                dayTasks.forEach(t => {
                  const timing = getTaskTiming(t);
                  if (timing) timedEntries.push({ task: t, timing });
                  else chipTasks.push(t);
                });

                // Overlap detection using resolved timings
                const placed: { task: Task; timing: { start: string; end: string }; colIdx: number; colCount: number }[] = [];
                timedEntries.forEach(({ task, timing }) => {
                  const sm = timeToMinutes(timing.start);
                  const em = timeToMinutes(timing.end);
                  const usedCols = placed
                    .filter(p => {
                      const ps = timeToMinutes(p.timing.start);
                      const pe = timeToMinutes(p.timing.end);
                      return sm < pe && em > ps;
                    })
                    .map(p => p.colIdx);
                  const col = usedCols.length === 0 ? 0 : Math.max(...usedCols) + 1;
                  placed.push({ task, timing, colIdx: col, colCount: 1 });
                });
                const maxCol = placed.reduce((m, p) => Math.max(m, p.colIdx), 0);
                placed.forEach(p => { p.colCount = maxCol + 1; });

                return (
                  <div
                    key={dateStr}
                    ref={el => { dayRefs.current[dateStr] = el; }}
                    style={{ flex: 1, minWidth: 120, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}
                  >
                    {/* Day header */}
                    <div style={{
                      height: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      borderBottom: `2px solid ${isSel ? themeColor : isToday ? '#ffccc7' : '#f0f0f0'}`,
                      position: 'sticky', top: 0, background: isSel ? '#fff5f5' : '#fff', zIndex: 10,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: 700, color: isSel ? themeColor : isToday ? themeColor : '#aaa', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                          {day.format('ddd')} {day.format('D')}
                        </Text>
                        {dayTasks.length > 0 && (
                          <Badge count={dayTasks.length} style={{ backgroundColor: isSel ? themeColor : '#e0e0e0', color: isSel ? '#fff' : '#888', boxShadow: 'none', fontSize: 9 }} />
                        )}
                      </div>
                    </div>

                    {/* All-day chips */}
                    {chipTasks.length > 0 && (
                      <div style={{ padding: '6px 6px 4px', borderBottom: '1px dashed #f0f0f0', background: isToday ? 'rgba(220,76,62,0.02)' : '#fafafa' }}>
                        {chipTasks.map((task, idx) => {
                          const gIdx = tasks.indexOf(task);
                          return <TaskChip key={task.id} task={task} paletteIdx={gIdx >= 0 ? gIdx : dayIdx * 20 + idx} onToggle={handleToggle} />;
                        })}
                      </div>
                    )}

                    {/* Time grid */}
                    <div style={{ position: 'relative', height: HOURS.length * HOUR_H, background: isToday ? 'rgba(220,76,62,0.012)' : '#fff' }}>
                      {/* Hour lines */}
                      {HOURS.map(h => (
                        <div key={h} style={{ position: 'absolute', top: (h - START_H) * HOUR_H, left: 0, right: 0, borderTop: h % 2 === 0 ? '1px solid #f0f0f0' : '1px dashed #f8f8f8' }} />
                      ))}

                      {/* Current time indicator */}
                      {isToday && nowTop !== null && (
                        <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, zIndex: 8, pointerEvents: 'none' }}>
                          <div style={{ height: 2, background: themeColor, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -5, top: -4, width: 10, height: 10, borderRadius: '50%', background: themeColor, animation: 'pulse 2s infinite' }} />
                          </div>
                        </div>
                      )}

                      {/* Selected day highlight */}
                      {isSel && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(220,76,62,0.025)', pointerEvents: 'none' }} />
                      )}

                      {/* Timed task blocks */}
                      {placed.map(({ task, timing, colIdx, colCount }) => {
                        const gIdx = tasks.indexOf(task);
                        return (
                          <TimedBlock key={task.id} task={task} paletteIdx={gIdx >= 0 ? gIdx : dayIdx * 20}
                            colIdx={colIdx} colCount={colCount}
                            startT={timing.start} endT={timing.end} />
                        );
                      })}

                      {/* Empty hint */}
                      {dayTasks.length === 0 && (
                        <div style={{ position: 'absolute', top: HOUR_H * 0.5, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                          <Text style={{ fontSize: 10, color: '#ebebeb' }}>—</Text>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Unscheduled ──────────────────────────────────────────── */}
            {unscheduled.length > 0 && (
              <div style={{ padding: '12px 16px' }}>
                <Collapse ghost defaultActiveKey={['u']} style={{ border: '1px solid #f0f0f0', borderRadius: 10, background: '#fafafa' }}>
                  <Collapse.Panel key="u" header={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UnorderedListOutlined style={{ color: '#aaa' }} />
                      <Text strong style={{ fontSize: 12, color: '#555' }}>Unscheduled</Text>
                      <Badge count={unscheduled.length} style={{ backgroundColor: '#e0e0e0', color: '#888', boxShadow: 'none', fontSize: 10 }} />
                    </div>
                  }>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 6, padding: '0 4px 8px' }}>
                      {unscheduled.map((task, idx) => {
                        const gIdx = tasks.indexOf(task);
                        return <TaskChip key={task.id} task={task} paletteIdx={gIdx >= 0 ? gIdx : idx} onToggle={handleToggle} />;
                      })}
                    </div>
                  </Collapse.Panel>
                </Collapse>
              </div>
            )}

            {/* All-week empty */}
            {!loading && filteredTasks.length === 0 && (
              <div style={{ padding: 40 }}>
                <Empty description="No tasks found. Try a different filter or week." />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeBlockingCalendar;

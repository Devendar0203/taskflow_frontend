import React, { useEffect, useState } from 'react';
import { Typography, Button, Row, Col, Empty, Progress, Skeleton } from 'antd';
import { PlusOutlined, ProjectOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { projectService } from '../services/project.service';
import { taskService } from '../services/task.service';
import { authService } from '../services/auth.service';
import { type Project } from '../types';
import CreateProjectModal from '../components/modals/CreateProjectModal';

const { Title, Text } = Typography;

// Jira-like Color palette for charts
const COLORS = ['#0052cc', '#36b37e', '#ff991f', '#ff5630', '#6554c0'];

const ProjectCard: React.FC<{ proj: Project; onClick: () => void }> = ({ proj, onClick }) => {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    taskService.getProjectProgress(proj.id)
      .then(setProgress)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [proj.id]);

  const percent = progress ? Math.round(progress.completion) : 0;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 8px 16px rgba(9, 30, 66, 0.1)' }}
      className="glass-card"
      onClick={onClick}
      style={{ cursor: 'pointer', padding: 20, height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #dfe1e6', borderRadius: 8 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ background: '#e6effc', padding: '8px', borderRadius: 6, display: 'flex' }}>
          <ProjectOutlined style={{ fontSize: 20, color: '#0052cc' }} />
        </div>
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ margin: 0, color: '#172b4d', lineHeight: 1.2 }}>{proj.name}</Title>
          <Text style={{ color: '#5e6c84', fontSize: '13px', display: 'block', marginTop: 4, height: 40, overflow: 'hidden' }}>
            {proj.description || 'No description'}
          </Text>
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        {loading ? (
           <Skeleton active paragraph={{ rows: 1 }} title={false} />
        ) : progress ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>{progress.done} of {progress.totalTasks} completed</Text>
              <Text style={{ fontWeight: 600, fontSize: '12px', color: percent === 100 ? '#36b37e' : '#0052cc' }}>{percent}%</Text>
            </div>
            <Progress 
              percent={percent} 
              strokeColor={percent === 100 ? "#36b37e" : "#0052cc"} 
              trailColor="#ebecf0"
              showInfo={false}
              size="small"
              status={percent === 100 ? "success" : "active"}
            />
          </div>
        ) : (
          <Progress percent={0} showInfo={false} trailColor="#ebecf0" size="small" />
        )}
      </div>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [globalStats, setGlobalStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectService.getProjects();
      setProjects(data || []);
      
      let totalTodo = 0, totalInProgress = 0, totalDone = 0;
      await Promise.all((data || []).map(async (p: Project) => {
        try {
          const prog = await taskService.getProjectProgress(p.id);
          totalTodo += prog.todo;
          totalInProgress += prog.inProgress;
          totalDone += prog.done;
        } catch(e) {}
      }));
      
      setGlobalStats([
        { name: 'To Do', value: totalTodo },
        { name: 'In Progress', value: totalInProgress },
        { name: 'Done', value: totalDone }
      ].filter(s => s.value > 0)); 
    } catch (error) {
      console.error(error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.2 } }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#172b4d' }}>All Projects</Title>
          <Text type="secondary" style={{ color: '#5e6c84' }}>Manage workspaces and track overall progress.</Text>
        </div>
        {user?.role === 'ADMIN' && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsModalOpen(true)}
            size="large"
            style={{ fontWeight: 600 }}
          >
            Create Project
          </Button>
        )}
      </div>

      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map(i => (
             <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                <div style={{ padding: 20, border: '1px solid #dfe1e6', borderRadius: 8, background: '#fff' }}>
                  <Skeleton active avatar paragraph={{ rows: 2 }} />
                </div>
             </Col>
          ))}
        </Row>
      ) : projects.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Empty 
            description={<span style={{ color: '#5e6c84', fontSize: '16px' }}>No projects available yet.</span>} 
            style={{ padding: '64px', margin: '40px 0', border: '1px dashed #dfe1e6', borderRadius: 8, background: '#fff' }} 
          >
            {user?.role === 'ADMIN' && (
              <Button type="primary" onClick={() => setIsModalOpen(true)}>Create First Project</Button>
            )}
          </Empty>
        </motion.div>
      ) : (
        <>
          {globalStats.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fff', border: '1px solid #dfe1e6', borderRadius: 8, padding: 24, marginBottom: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 300px', marginBottom: 16 }}>
                <Title level={4} style={{ color: '#172b4d', marginTop: 0 }}>Organization Health</Title>
                <Text style={{ color: '#5e6c84' }}>Tasks across all active projects.</Text>
                <div style={{ marginTop: 24, display: 'flex', gap: 32 }}>
                  {globalStats.map((stat, i) => (
                    <div key={stat.name}>
                      <div style={{ fontSize: '24px', fontWeight: 600, color: COLORS[i % COLORS.length] }}>{stat.value}</div>
                      <Text type="secondary" style={{ fontSize: '13px' }}>{stat.name}</Text>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: '1 1 300px', height: 200, minWidth: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={globalStats} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                      {globalStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #dfe1e6', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <Row gutter={[16, 16]}>
              {projects.map((proj) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={proj.id}>
                  <motion.div variants={itemVariants} style={{ height: '100%' }}>
                    <ProjectCard proj={proj} onClick={() => navigate(`/projects/${proj.id}`)} />
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>
        </>
      )}

      {user?.role === 'ADMIN' && (
        <CreateProjectModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchProjects} />
      )}
    </div>
  );
};

export default Dashboard;

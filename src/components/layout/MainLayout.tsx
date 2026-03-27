import React, { useState, useEffect, Suspense } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Drawer, Typography, Badge, Collapse, List, Spin, message } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MenuOutlined,
  BellOutlined,
  PlusOutlined,
  SearchOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
  QuestionCircleOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { authService } from '../../services/auth.service';
import { projectService } from '../../services/project.service';
import { type Project } from '../../types';
import CreateTaskModal from '../modals/CreateTaskModal';
import CreateProjectModal from '../modals/CreateProjectModal';
import { useThemeContext } from '../../context/ThemeContext';

const { Sider, Content } = Layout;
const { Text } = Typography;
const { Panel } = Collapse;

const GridCalendarIcon = ({ style }: { style?: React.CSSProperties }) => (
  <span role="img" aria-label="grid-calendar" className="anticon" style={{ ...style, display: 'inline-flex', alignItems: 'center' }}>
    <svg viewBox="-1 1 25 21" fill="currentColor" width="1em" height="1em" aria-hidden="true" focusable="false">
      <defs>
        <mask id="cal-front-mask">
          <rect x="0" y="0" width="28" height="28" fill="white" />
          <rect x="1.5" y="10.5" width="19" height="1.5" fill="black" />
          
          <rect x="3" y="13" width="2.5" height="2.5" rx="0.5" fill="black" />
          <rect x="6.5" y="13" width="2.5" height="2.5" rx="0.5" fill="black" />
          <rect x="10" y="13" width="2.5" height="2.5" rx="0.5" fill="black" />
          <rect x="13.5" y="13" width="2.5" height="2.5" rx="0.5" fill="black" />
          <rect x="17" y="13" width="2.5" height="2.5" rx="0.5" fill="black" />
          
          <rect x="3" y="16.5" width="2.5" height="2.5" rx="0.5" fill="black" />
          <rect x="6.5" y="16.5" width="2.5" height="2.5" rx="0.5" fill="black" />
          <rect x="10" y="16.5" width="2.5" height="2.5" rx="0.5" fill="black" />
          <rect x="13.5" y="16.5" width="2.5" height="2.5" rx="0.5" fill="black" />
          <rect x="17" y="16.5" width="2.5" height="2.5" rx="0.5" fill="black" />
          
          <rect x="3" y="20" width="2.5" height="2.5" rx="0.5" fill="black" />
          <rect x="6.5" y="20" width="2.5" height="2.5" rx="0.5" fill="black" />
          <rect x="10" y="20" width="2.5" height="2.5" rx="0.5" fill="black" />
          <rect x="13.5" y="20" width="2.5" height="2.5" rx="0.5" fill="black" />
          <rect x="17" y="20" width="2.5" height="2.5" rx="0.5" fill="black" />
          
          <rect x="5" y="3" width="2" height="6" rx="1" fill="black" />
          <rect x="10" y="3" width="2" height="6" rx="1" fill="black" />
          <rect x="15" y="3" width="2" height="6" rx="1" fill="black" />
        </mask>
      </defs>

      <path d="M21 8 h1 a2 2 0 0 1 2 2 v11 a2 2 0 0 1 -2 2 h-14 a2 2 0 0 1 -1.5 -0.6 v1.6 a2 2 0 0 0 2 2 h13.5 a2 2 0 0 0 2 -2 V9 a2 2 0 0 0 -2 -2 h-1 Z" />
      <rect x="1" y="7" width="20" height="17" rx="2" ry="2" mask="url(#cal-front-mask)" />
      
      <rect x="4.5" y="2" width="3" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="9.5" y="2" width="3" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14.5" y="2" width="3" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  </span>
);

const ComingUpSignIcon = ({ style }: { style?: React.CSSProperties }) => (
  <span role="img" aria-label="coming-up-sign" className="anticon" style={{ ...style, display: 'inline-flex', alignItems: 'center' }}>
    <svg viewBox="5 7 90 88" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="8" y="10" width="84" height="48" rx="8" />
      <line x1="25" y1="58" x2="25" y2="82" />
      <line x1="75" y1="58" x2="75" y2="82" />
      <path d="M 12 92 L 12 82 L 38 82 L 38 92 Z" />
      <path d="M 62 92 L 62 82 L 88 82 L 88 92 Z" />
      <text x="50" y="35" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="20" textAnchor="middle" fill="currentColor" stroke="none" letterSpacing="1">COMING</text>
      <text x="50" y="52" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="20" textAnchor="middle" fill="currentColor" stroke="none" letterSpacing="1">UP</text>
    </svg>
  </span>
);

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { themeColor } = useThemeContext();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    fetchProjects();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 500) newWidth = 500;
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleRoleSwitch = async () => {
    if (!user) return;
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await authService.switchRole(newRole);
      message.success(`Switched to ${newRole} view`);
      window.location.reload();
    } catch (e: any) {
      console.error('Failed to switch role on backend', e);
      const errMsg = e?.response?.data?.message || e?.message || 'Failed to switch role';
      message.error(errMsg);
    }
  };

  const activeKey = location.pathname;

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 0' }}>

      {/* Top Profile Area */}
      <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Dropdown menu={{
          items: [
            { key: 'settings', label: 'Settings', icon: <SettingOutlined />, onClick: () => navigate('/settings') },
            { key: 'role-switch', label: `Switch to ${user?.role === 'ADMIN' ? 'USER' : 'ADMIN'} view`, icon: <ProfileOutlined />, onClick: handleRoleSwitch },
            { type: 'divider' },
            { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: handleLogout, danger: true }
          ]
        }} trigger={['click']}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, transition: 'background 0.2s' }} className="sidebar-hover-item">
            <Avatar size={28} style={{ backgroundColor: themeColor }}>{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</Avatar>
            <Text strong style={{ fontSize: '14px', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.email}</Text>
            <DownOutlined style={{ fontSize: '10px', color: '#666' }} />
          </div>
        </Dropdown>
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="text" icon={<BellOutlined style={{ fontSize: '16px', color: '#555' }} />} size="small" />
        </div>
      </div>

      {/* Add Task Button or Create Project (Admin) */}
      <div style={{ padding: '0 16px', marginBottom: 8 }}>
        {user?.role === 'ADMIN' ? (
          <div
            onClick={() => setIsCreateProjectModalOpen(true)}
            className="sidebar-add-task sidebar-hover-item"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px', cursor: 'pointer', borderRadius: 8, color: themeColor, fontWeight: 600 }}
          >
            <div style={{ background: themeColor, borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <PlusOutlined style={{ fontSize: '14px' }} />
            </div>
            Create project
          </div>
        ) : (
          <div
            onClick={() => setIsCreateTaskOpen(true)}
            className="sidebar-add-task sidebar-hover-item"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px', cursor: 'pointer', borderRadius: 8, color: themeColor, fontWeight: 600 }}
          >
            <div style={{ background: themeColor, borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <PlusOutlined style={{ fontSize: '14px' }} />
            </div>
            Add task
          </div>
        )}
      </div>

      {/* Search Output */}
      <div style={{ padding: '0 16px', marginBottom: 8 }}>
        <div className="sidebar-hover-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px', cursor: 'pointer', borderRadius: 8, color: '#555' }}>
          <SearchOutlined style={{ fontSize: '16px', color: themeColor }} />
          <Text>Search</Text>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          style={{ borderRight: 0, padding: '0 8px', background: 'transparent' }}
          items={user?.role === 'ADMIN' ? [
            {
              key: '/dashboard',
              icon: <AppstoreOutlined style={{ color: '#eb8909', fontSize: '18px' }} />,
              label: 'Admin Dashboard',
              onClick: () => { navigate('/dashboard'); if (isMobile) setMobileMenuOpen(false); }
            }
          ] : [
            {
              key: '/my-tasks',
              icon: <ProfileOutlined style={{ color: '#246fe0', fontSize: '18px' }} />,
              label: 'All Tasks',
              onClick: () => { navigate('/my-tasks'); if (isMobile) setMobileMenuOpen(false); }
            },
            {
              key: '/today',
              icon: <CalendarOutlined style={{ color: '#058527', fontSize: '18px' }} />,
              label: <div style={{ display: 'flex', justifyContent: 'space-between' }}>My Day <Badge count={5} style={{ backgroundColor: '#f5f5f5', color: '#666', boxShadow: 'none' }} /></div>,
              onClick: () => { navigate('/today'); if (isMobile) setMobileMenuOpen(false); }
            },
            {
              key: '/upcoming',
              icon: <ComingUpSignIcon style={{ color: '#692fc2', fontSize: '18px' }} />,
              label: 'Planned',
              onClick: () => { navigate('/upcoming'); if (isMobile) setMobileMenuOpen(false); }
            },
            {
              key: '/filters-labels',
              icon: <GridCalendarIcon style={{ color: '#eb8909', fontSize: '18px' }} />,
              label: 'Labels',
              onClick: () => { navigate('/filters-labels'); if (isMobile) setMobileMenuOpen(false); }
            },
            {
              key: '/completed',
              icon: <CheckCircleOutlined style={{ color: '#555', fontSize: '18px' }} />,
              label: 'Completed',
              onClick: () => { navigate('/completed'); if (isMobile) setMobileMenuOpen(false); }
            }
          ]}
        />

        <div style={{ padding: '16px 8px 0' }}>
          <Collapse ghost expandIconPosition="end" defaultActiveKey={['projects']}>
            <Panel header={<Text strong style={{ fontSize: '13px', color: '#555' }}>{user?.role === 'ADMIN' ? 'All Projects' : 'My Projects'}</Text>} key="projects" style={{ padding: 0 }}>
              <List
                size="small"
                dataSource={projects}
                renderItem={proj => (
                  <List.Item
                    style={{ border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' }}
                    className="sidebar-hover-item"
                    onClick={() => { navigate(`/projects/${proj.id}`); if (isMobile) setMobileMenuOpen(false); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: '#888', fontSize: '18px' }}>#</span>
                      <Text style={{ fontSize: '14px', color: activeKey === `/projects/${proj.id}` ? '#000' : '#444' }}>{proj.name}</Text>
                    </div>
                  </List.Item>
                )}
              />
              <div
                style={{ padding: '8px 12px', color: '#888', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderRadius: 8 }}
                className="sidebar-hover-item"
                onClick={() => navigate('/dashboard')}
              >
                <AppstoreOutlined />
                <Text style={{ fontSize: '14px', color: '#888' }}>Browse all projects</Text>
              </div>
            </Panel>
          </Collapse>
        </div>
      </div>

      {/* Bottom Area */}
      <div style={{ padding: '16px', marginTop: 'auto', borderTop: '1px solid #f0f0f0' }}>
        <div className="sidebar-hover-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px', cursor: 'pointer', borderRadius: 8, color: '#555' }}>
          <QuestionCircleOutlined style={{ fontSize: '16px', color: themeColor }} />
          <Text style={{ fontSize: '13px' }}>Help & resources</Text>
        </div>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      {isMobile && !mobileMenuOpen && (
        <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 999 }}>
          <Button icon={<MenuOutlined />} onClick={() => setMobileMenuOpen(true)} />
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <>
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            width={sidebarWidth}
            theme="light"
            trigger={null}
            style={{
              background: '#fcfaf8',
              borderRight: '1px solid #f0f0f0',
              height: '100vh',
              position: 'fixed',
              left: 0,
              overflow: 'auto',
              paddingTop: 12,
              zIndex: 10
            }}
          >
            {sidebarContent}
          </Sider>
          {/* Drag Handle */}
          {!collapsed && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
              style={{
                position: 'fixed',
                left: sidebarWidth,
                top: 0,
                bottom: 0,
                width: 8,
                marginLeft: -4,
                cursor: 'col-resize',
                backgroundColor: isResizing ? '#ffffffff' : 'transparent',
                transition: isResizing ? 'none' : 'background-color 0.2s',
                zIndex: 11
              }}
              onMouseEnter={(e) => {
                if (!isResizing) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            />
          )}
        </>
      )}

      {/* Mobile Sidebar Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        bodyStyle={{ padding: 0, background: '#fcfaf8' }}
        width={300}
        closable={false}
      >
        {sidebarContent}
      </Drawer>

      {/* Main Content Area */}
      <Layout style={{ background: '#fff', marginLeft: (!isMobile && !collapsed) ? sidebarWidth : (!isMobile && collapsed) ? 80 : 0, transition: isResizing ? 'none' : 'margin-left 0.2s' }}>
        <Content style={{ margin: 0, display: 'flex', flexDirection: 'column', flex: 1, padding: isMobile ? '60px 16px 16px' : 0 }}>
          <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin size="large" /></div>}>
                <Outlet />
              </Suspense>
            </motion.div>
        </Content>
      </Layout>

      <CreateTaskModal open={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} onSuccess={() => { }} />
      <CreateProjectModal open={isCreateProjectModalOpen} onClose={() => setIsCreateProjectModalOpen(false)} onSuccess={fetchProjects} />
    </Layout>
  );
};

export default MainLayout;

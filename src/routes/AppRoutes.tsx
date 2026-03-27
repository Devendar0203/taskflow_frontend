import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import PrivateRoute from './PrivateRoute';
import MainLayout from '../components/layout/MainLayout';
import { authService } from '../services/auth.service';

// Lazy loading core pages for code splitting
const Login = React.lazy(() => import('../pages/Login'));
const Register = React.lazy(() => import('../pages/Register'));
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Project = React.lazy(() => import('../pages/Project'));
const MyTasks = React.lazy(() => import('../pages/MyTasks'));
const Today = React.lazy(() => import('../pages/Today'));
const Upcoming = React.lazy(() => import('../pages/Upcoming'));
const Settings = React.lazy(() => import('../pages/Settings'));
const TimeBlockingCalendar = React.lazy(() => import('../pages/TimeBlockingCalendar'));
const Completed = React.lazy(() => import('../pages/Completed'));

const TopLoader = () => (
  <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
    <Spin size="large" />
  </div>
);

const AppRoutes: React.FC = () => {
  const user = authService.getCurrentUser();
  const defaultRoute = user?.role === 'ADMIN' ? '/dashboard' : '/today';

  return (
    <Suspense fallback={<TopLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/projects/:projectId" element={<Project />} />
            
            {/* New Todoist Routes */}
            <Route path="/today" element={<Today />} />
            <Route path="/upcoming" element={<Upcoming />} />
            <Route path="/filters-labels" element={<TimeBlockingCalendar />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/completed" element={<Completed />} />

            <Route path="*" element={<Navigate to={defaultRoute} replace />} />
          </Route>
        </Route>
        
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

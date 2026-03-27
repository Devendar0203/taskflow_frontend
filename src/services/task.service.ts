import api from './api';
import { type Task, type TaskStatus } from '../types';

export const taskService = {
  createTask: async (data: Partial<Task>) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },
  getMyTasks: async () => {
    const response = await api.get('/tasks');
    return response.data as Task[];
  },
  updateTask: async (id: number, data: Partial<Task>) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },
  updateTaskStatus: async (id: number, status: TaskStatus) => {
    const response = await api.patch(`/tasks/${id}/status`, null, { params: { status } });
    return response.data;
  },
  assignTask: async (taskId: number, userId: number) => {
    const response = await api.post(`/tasks/${taskId}/assign/${userId}`);
    return response.data;
  },
  getTasksByProject: async (groupId: number) => {
    const response = await api.get(`/tasks/group/${groupId}`);
    return response.data as Task[];
  },
  getProjectProgress: async (groupId: number) => {
    const response = await api.get(`/tasks/project/${groupId}/progress`);
    return response.data;
  },
  deleteTask: async (id: number) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }
};

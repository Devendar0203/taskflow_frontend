import api from './api';
import { type Project, type User } from '../types';

export const projectService = {
  getProjects: async () => {
    const response = await api.get('/groups');
    return response.data as Project[];
  },
  createProject: async (data: Partial<Project>) => {
    const response = await api.post('/groups', data);
    return response.data;
  },
  addMemberToGroup: async (groupId: number, userId: number) => {
    const response = await api.post(`/groups/${groupId}/add/${userId}`);
    return response.data;
  },
  getGroupMembers: async (groupId: number) => {
    const response = await api.get(`/groups/${groupId}/members`);
    return response.data as User[];
  },
  deleteProject: async (groupId: number) => {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  }
};

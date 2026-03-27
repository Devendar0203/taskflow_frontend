import api from './api';
import { type LoginRequest, type RegisterRequest, type User } from '../types';

export const authService = {

  // 🔐 LOGIN
  login: async (data: LoginRequest) => {
    const response = await api.post('/users/login', data);
    const result = response.data;

    let token = null;

    if (typeof result === 'string') {
      token = result;
    } else if (result?.token) {
      token = result.token;

      // store user info correctly from nested user object or fallback to root if not nested
      const userObj = result.user || result;
      localStorage.setItem('user', JSON.stringify({
        id: userObj.id,
        email: userObj.email,
        name: userObj.name,
        role: userObj.role
      }));
    }

    if (!token) {
      throw new Error("No token received");
    }

    localStorage.setItem('token', token);

    return result;
  },

  // 🔄 SWITCH ROLE
  switchRole: async (role: string) => {
    const response = await api.put(`/users/switch-role?role=${role}`);
    const result = response.data;
    
    if (result?.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify({
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role
      }));
    }
    return result;
  },

  // 📝 REGISTER
  register: async (data: RegisterRequest) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  // 🚪 LOGOUT
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = "/login";
  },

  // 👥 GET ALL USERS
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data as User[];
  },

  // 👤 CURRENT USER
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
};
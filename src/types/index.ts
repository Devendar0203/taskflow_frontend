export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface RegisterRequest {
  email?: string;
  password?: string;
  name?: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  role?: 'ADMIN' | 'USER';
}

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  groupId?: number;
  assignedUserId?: number;
  dueDate?: string;
  startTime?: string;  // "HH:mm" e.g. "09:00"
  endTime?: string;    // "HH:mm" e.g. "10:30"
}

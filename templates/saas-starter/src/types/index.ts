export interface Project {
  id?: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  owner: string;
  members: string[];
  dueDate: string;
  createdAt: string;
}

export interface Task {
  id?: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  createdAt: string;
}

export interface TeamMember {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  avatarUrl?: string;
  joinedAt: string;
}

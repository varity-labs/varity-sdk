'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@varity-labs/ui-kit';
import { projects, tasks, teamMembers } from './database';
import type { Project, Task, TeamMember } from '../types';

export function useCurrentUser() {
  const { user, authenticated, logout } = usePrivy();

  return {
    email: user?.email?.address || '',
    name: user?.email?.address?.split('@')[0] || 'User',
    authenticated,
    logout,
  };
}

interface UseCollectionReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  create: (item: any) => Promise<void>;
  update: (id: string, updates: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProjects(): UseCollectionReturn<Project> {
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await projects().get();
      setData(result as Project[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (input: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...input,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => [newProject, ...prev]);

    try {
      await projects().add({ ...input, createdAt: newProject.createdAt });
      await refresh();
    } catch (err) {
      setData((prev) => prev.filter((p) => p.id !== newProject.id));
      throw err;
    }
  };

  const update = async (id: string, updates: Partial<Project>) => {
    const original = data.find((p) => p.id === id);
    setData((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    try {
      await projects().update(id, updates);
    } catch (err) {
      if (original) {
        setData((prev) =>
          prev.map((p) => (p.id === id ? original : p))
        );
      }
      throw err;
    }
  };

  const remove = async (id: string) => {
    const original = data.find((p) => p.id === id);
    setData((prev) => prev.filter((p) => p.id !== id));

    try {
      await projects().delete(id);
    } catch (err) {
      if (original) setData((prev) => [...prev, original]);
      throw err;
    }
  };

  return { data, loading, error, create, update, remove, refresh };
}

export function useTasks(projectId?: string): UseCollectionReturn<Task> {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await tasks().get();
      setAllTasks(result as Task[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const data = projectId
    ? allTasks.filter((t) => t.projectId === projectId)
    : allTasks;

  const create = async (input: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...input,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAllTasks((prev) => [newTask, ...prev]);

    try {
      await tasks().add({ ...input, createdAt: newTask.createdAt });
      await refresh();
    } catch (err) {
      setAllTasks((prev) => prev.filter((t) => t.id !== newTask.id));
      throw err;
    }
  };

  const update = async (id: string, updates: Partial<Task>) => {
    const original = allTasks.find((t) => t.id === id);
    setAllTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    try {
      await tasks().update(id, updates);
    } catch (err) {
      if (original) {
        setAllTasks((prev) =>
          prev.map((t) => (t.id === id ? original : t))
        );
      }
      throw err;
    }
  };

  const remove = async (id: string) => {
    const original = allTasks.find((t) => t.id === id);
    setAllTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await tasks().delete(id);
    } catch (err) {
      if (original) setAllTasks((prev) => [...prev, original]);
      throw err;
    }
  };

  return { data, loading, error, create, update, remove, refresh };
}

export function useTeam(): UseCollectionReturn<TeamMember> {
  const [data, setData] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await teamMembers().get();
      setData(result as TeamMember[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (input: Omit<TeamMember, 'id' | 'joinedAt'>) => {
    const newMember: TeamMember = {
      ...input,
      id: `temp-${Date.now()}`,
      joinedAt: new Date().toISOString(),
    };
    setData((prev) => [newMember, ...prev]);

    try {
      await teamMembers().add({ ...input, joinedAt: newMember.joinedAt });
      await refresh();
    } catch (err) {
      setData((prev) => prev.filter((m) => m.id !== newMember.id));
      throw err;
    }
  };

  const update = async (id: string, updates: Partial<TeamMember>) => {
    const original = data.find((m) => m.id === id);
    setData((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );

    try {
      await teamMembers().update(id, updates);
    } catch (err) {
      if (original) {
        setData((prev) =>
          prev.map((m) => (m.id === id ? original : m))
        );
      }
      throw err;
    }
  };

  const remove = async (id: string) => {
    const original = data.find((m) => m.id === id);
    setData((prev) => prev.filter((m) => m.id !== id));

    try {
      await teamMembers().delete(id);
    } catch (err) {
      if (original) setData((prev) => [...prev, original]);
      throw err;
    }
  };

  return { data, loading, error, create, update, remove, refresh };
}

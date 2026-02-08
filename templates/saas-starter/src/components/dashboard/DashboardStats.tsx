'use client';

import { KPICard } from '@varity-labs/ui-kit';
import { FolderKanban, ListTodo, Users, TrendingUp } from 'lucide-react';
import type { Project, Task, TeamMember } from '@/types';

interface DashboardStatsProps {
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
  loading?: boolean;
}

export function DashboardStats({
  projects,
  tasks,
  team,
  loading = false,
}: DashboardStatsProps) {
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const activeTasks = tasks.filter((t) => t.status !== 'done').length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate =
    tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Active Projects"
        value={activeProjects}
        subtitle={`${projects.length} total`}
        icon={<FolderKanban className="h-5 w-5" />}
        loading={loading}
      />
      <KPICard
        title="Open Tasks"
        value={activeTasks}
        subtitle={`${doneTasks} completed`}
        icon={<ListTodo className="h-5 w-5" />}
        loading={loading}
      />
      <KPICard
        title="Team Members"
        value={team.length}
        icon={<Users className="h-5 w-5" />}
        loading={loading}
      />
      <KPICard
        title="Completion Rate"
        value={`${completionRate}%`}
        icon={<TrendingUp className="h-5 w-5" />}
        trend={completionRate >= 50 ? 'up' : completionRate > 0 ? 'neutral' : undefined}
        trendValue={completionRate > 0 ? `${completionRate}%` : undefined}
        loading={loading}
      />
    </div>
  );
}

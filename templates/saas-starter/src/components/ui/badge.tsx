import type { ReactNode } from 'react';

type BadgeVariant = 'green' | 'blue' | 'yellow' | 'red' | 'gray';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  green: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  yellow: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  red: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
};

export function Badge({ children, variant = 'gray', dot = false }: BadgeProps) {
  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />}
      {children}
    </span>
  );
}

const priorityVariants: Record<string, BadgeVariant> = {
  high: 'red',
  medium: 'yellow',
  low: 'gray',
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant={priorityVariants[priority] || 'gray'}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

const projectStatusVariants: Record<string, BadgeVariant> = {
  active: 'blue',
  paused: 'yellow',
  completed: 'green',
};

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={projectStatusVariants[status] || 'gray'} dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

const taskStatusVariants: Record<string, BadgeVariant> = {
  todo: 'gray',
  in_progress: 'blue',
  done: 'green',
};

const taskStatusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={taskStatusVariants[status] || 'gray'} dot>
      {taskStatusLabels[status] || status}
    </Badge>
  );
}

const roleVariants: Record<string, BadgeVariant> = {
  admin: 'blue',
  member: 'green',
  viewer: 'gray',
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <Badge variant={roleVariants[role] || 'gray'}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
}

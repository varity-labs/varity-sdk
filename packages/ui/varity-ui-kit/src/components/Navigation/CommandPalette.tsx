'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  FolderKanban,
  ListTodo,
  Users,
  LayoutDashboard,
  Settings,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';

// Icon name type for serialization-safe storage
type IconName = 'LayoutDashboard' | 'FolderKanban' | 'ListTodo' | 'Users' | 'Settings';

// Icon map for runtime rendering
const ICON_MAP: Record<IconName, LucideIcon> = {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  Settings,
};

// Helper to render icon from string identifier
function getIcon(iconName: IconName, className: string = 'h-4 w-4'): React.ReactNode {
  const Icon = ICON_MAP[iconName];
  return <Icon className={className} />;
}

interface SearchResult {
  id: string;
  label: string;
  description?: string;
  category: 'navigation' | 'project' | 'task' | 'team';
  icon: IconName;
  path: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  projects?: Array<{ id: string; name: string; description?: string; status?: string }>;
  tasks?: Array<{ id: string; title: string; description?: string; status?: string }>;
  team?: Array<{ id: string; name: string; email: string }>;
}

const NAV_ITEMS: SearchResult[] = [
  { id: 'nav-dashboard', label: 'Dashboard', category: 'navigation', icon: 'LayoutDashboard', path: '/dashboard' },
  { id: 'nav-projects', label: 'Projects', category: 'navigation', icon: 'FolderKanban', path: '/dashboard/projects' },
  { id: 'nav-tasks', label: 'Tasks', category: 'navigation', icon: 'ListTodo', path: '/dashboard/tasks' },
  { id: 'nav-team', label: 'Team', category: 'navigation', icon: 'Users', path: '/dashboard/team' },
  { id: 'nav-settings', label: 'Settings', category: 'navigation', icon: 'Settings', path: '/dashboard/settings' },
];

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Navigation',
  project: 'Projects',
  task: 'Tasks',
  team: 'Team',
};

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  projects = [],
  tasks = [],
  team = []
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const getResults = useCallback((): SearchResult[] => {
    const q = query.toLowerCase().trim();

    if (!q) return NAV_ITEMS;

    const results: SearchResult[] = [];

    // Navigation matches
    NAV_ITEMS.forEach((item) => {
      if (item.label.toLowerCase().includes(q)) {
        results.push(item);
      }
    });

    // Project matches (top 3)
    projects
      .filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((p) => {
        results.push({
          id: `project-${p.id}`,
          label: p.name,
          description: p.status,
          category: 'project',
          icon: 'FolderKanban',
          path: '/dashboard/projects',
        });
      });

    // Task matches (top 3)
    tasks
      .filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((t) => {
        results.push({
          id: `task-${t.id}`,
          label: t.title,
          description: t.status,
          category: 'task',
          icon: 'ListTodo',
          path: '/dashboard/tasks',
        });
      });

    // Team matches (top 3)
    team
      .filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((m) => {
        results.push({
          id: `team-${m.id}`,
          label: m.name,
          description: m.email,
          category: 'team',
          icon: 'Users',
          path: '/dashboard/team',
        });
      });

    return results;
  }, [query, projects, tasks, team]);

  const results = getResults();

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {});

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Clamp active index when results change
  useEffect(() => {
    if (activeIndex >= results.length) {
      setActiveIndex(Math.max(0, results.length - 1));
    }
  }, [results.length, activeIndex]);

  function selectResult(result: SearchResult) {
    onClose();
    onNavigate(result.path);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      selectResult(results[activeIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  if (!open) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, tasks, team members..."
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
          <kbd className="hidden rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400 sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-gray-500">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {CATEGORY_LABELS[category] || category}
                </div>
                {items.map((result) => {
                  const idx = flatIndex++;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={result.id}
                      onClick={() => selectResult(result)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className={isActive ? 'text-primary-500' : 'text-gray-400'}>
                        {getIcon(result.icon)}
                      </span>
                      <span className="flex-1 truncate text-left font-medium">{result.label}</span>
                      {result.description && (
                        <span className="truncate text-xs text-gray-400">{result.description}</span>
                      )}
                      {isActive && <ArrowRight className="h-3 w-3 shrink-0 text-primary-400" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}

import {
  LayoutDashboard,
  Users,
  BarChart3,
  ListChecks,
  Shield,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Project Dashboard',
    description:
      'See all your projects at a glance with real-time status, progress, and deadlines in one unified view.',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    hoverBorder: 'hover:border-blue-200',
  },
  {
    icon: ListChecks,
    title: 'Task Management',
    description:
      'Create, assign, and track tasks with priorities, statuses, and due dates. Keep every deliverable on track.',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    hoverBorder: 'hover:border-amber-200',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Invite team members, assign roles, and coordinate work. Everyone stays aligned without endless meetings.',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    hoverBorder: 'hover:border-green-200',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description:
      'Track completion rates, team velocity, and project health with KPIs that update as your team works.',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    hoverBorder: 'hover:border-purple-200',
  },
  {
    icon: Shield,
    title: 'Secure by Default',
    description:
      'Email and social login built in. Your data is protected with industry-standard authentication and encryption.',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    hoverBorder: 'hover:border-rose-200',
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description:
      'No complex configuration. Sign up, create a project, and invite your team in under a minute.',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    hoverBorder: 'hover:border-cyan-200',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Features
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Everything your team needs
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Simple, powerful tools to keep projects moving and teams productive.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-200 ${feature.hoverBorder} hover:shadow-md hover:-translate-y-1`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 leading-relaxed text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

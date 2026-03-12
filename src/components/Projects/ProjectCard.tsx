import { MapPin, Calendar, CheckSquare, FileText } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    domain: string;
    city: string;
    status: 'planning' | 'in_progress' | 'review' | 'launched';
    service_pages_count: number;
    area_pages_count: number;
    launch_date: string | null;
    user: {
      full_name: string;
    } | null;
  };
  onClick: () => void;
}

const statusConfig = {
  planning: { label: 'Planning', color: 'bg-orange-100 text-orange-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'Review', color: 'bg-yellow-100 text-yellow-700' },
  launched: { label: 'Launched', color: 'bg-green-100 text-green-700' },
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = statusConfig[project.status];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
          <p className="text-sm text-slate-500 truncate">{project.domain}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin size={16} />
          <span>{project.city}</span>
        </div>
        {project.user && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
              {project.user.full_name[0].toUpperCase()}
            </div>
            <span>{project.user.full_name}</span>
          </div>
        )}
        {project.launch_date && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={16} />
            <span>Launch: {new Date(project.launch_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <FileText size={16} />
          <span>{project.service_pages_count} services</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <CheckSquare size={16} />
          <span>{project.area_pages_count} areas</span>
        </div>
      </div>
    </div>
  );
}

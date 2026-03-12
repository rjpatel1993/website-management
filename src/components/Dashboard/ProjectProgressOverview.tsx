import { useEffect, useState } from 'react';
import { FolderKanban, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

interface ProjectProgress {
  id: string;
  name: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
}

export function ProjectProgressOverview({ onProjectClick }: { onProjectClick: (id: string) => void }) {
  const [projects, setProjects] = useState<ProjectProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectProgress();
  }, []);

  useRealtimeSubscription({
    table: 'projects',
    onChange: () => {
      loadProjectProgress();
    },
  });

  useRealtimeSubscription({
    table: 'checklist_items',
    onChange: () => {
      loadProjectProgress();
    },
  });

  const loadProjectProgress = async () => {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status')
        .in('status', ['planning', 'in_progress', 'review'])
        .order('created_at', { ascending: false });

      if (projects) {
        const projectsWithProgress = await Promise.all(
          projects.map(async (project) => {
            const { data: tasks } = await supabase
              .from('checklist_items')
              .select('id, is_completed')
              .eq('project_id', project.id);

            const total_tasks = tasks?.length || 0;
            const completed_tasks = tasks?.filter((t) => t.is_completed).length || 0;
            const completion_percentage = total_tasks > 0 ? Math.round((completed_tasks / total_tasks) * 100) : 0;

            return {
              ...project,
              total_tasks,
              completed_tasks,
              completion_percentage,
            };
          })
        );

        setProjects(projectsWithProgress);
      }
    } catch (error) {
      console.error('Error loading project progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-orange-100 text-orange-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'review':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning':
        return 'Planning';
      case 'in_progress':
        return 'In Progress';
      case 'review':
        return 'Review';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Project Progress</h2>
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Project Progress</h2>
        <div className="text-center py-8 text-slate-500">No active projects</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <FolderKanban size={24} className="text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-900">Project Progress</h2>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onProjectClick(project.id)}
            className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate mb-1">{project.name}</h3>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>
              <ChevronRight size={20} className="text-slate-400 flex-shrink-0" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {project.completed_tasks} of {project.total_tasks} tasks completed
                </span>
                <span className="font-semibold text-slate-900">{project.completion_percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.completion_percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

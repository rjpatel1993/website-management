import { useEffect, useState } from 'react';
import { FileText, MapPin, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

interface ProjectPages {
  id: string;
  name: string;
  service_pages_total: number;
  service_pages_completed: number;
  area_pages_total: number;
  area_pages_completed: number;
}

export function PagesTrackingOverview({ onProjectClick }: { onProjectClick: (id: string) => void }) {
  const [projects, setProjects] = useState<ProjectPages[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    service_total: 0,
    service_completed: 0,
    area_total: 0,
    area_completed: 0,
  });

  useEffect(() => {
    loadPagesData();
  }, []);

  useRealtimeSubscription({
    table: 'projects',
    onChange: () => {
      loadPagesData();
    },
  });

  useRealtimeSubscription({
    table: 'service_pages',
    onChange: () => {
      loadPagesData();
    },
  });

  useRealtimeSubscription({
    table: 'area_pages',
    onChange: () => {
      loadPagesData();
    },
  });

  const loadPagesData = async () => {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .in('status', ['planning', 'in_progress', 'review'])
        .order('created_at', { ascending: false });

      if (projects) {
        const projectsWithPages = await Promise.all(
          projects.map(async (project) => {
            const { data: servicePages } = await supabase
              .from('service_pages')
              .select('id, is_completed')
              .eq('project_id', project.id);

            const { data: areaPages } = await supabase
              .from('area_pages')
              .select('id, is_completed')
              .eq('project_id', project.id);

            const service_pages_total = servicePages?.length || 0;
            const service_pages_completed = servicePages?.filter((p) => p.is_completed).length || 0;
            const area_pages_total = areaPages?.length || 0;
            const area_pages_completed = areaPages?.filter((p) => p.is_completed).length || 0;

            return {
              ...project,
              service_pages_total,
              service_pages_completed,
              area_pages_total,
              area_pages_completed,
            };
          })
        );

        const filteredProjects = projectsWithPages.filter(
          (p) => p.service_pages_total > 0 || p.area_pages_total > 0
        );

        setProjects(filteredProjects);

        const totals = filteredProjects.reduce(
          (acc, p) => ({
            service_total: acc.service_total + p.service_pages_total,
            service_completed: acc.service_completed + p.service_pages_completed,
            area_total: acc.area_total + p.area_pages_total,
            area_completed: acc.area_completed + p.area_pages_completed,
          }),
          { service_total: 0, service_completed: 0, area_total: 0, area_completed: 0 }
        );

        setTotalStats(totals);
      }
    } catch (error) {
      console.error('Error loading pages data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Pages Tracking</h2>
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Service & Area Pages</h2>
        <div className="text-center py-8 text-slate-500">No pages created yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText size={24} className="text-green-600" />
        <h2 className="text-lg font-semibold text-slate-900">Service & Area Pages</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-blue-600" />
            <p className="text-sm font-medium text-blue-900">Service Pages</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {totalStats.service_completed}/{totalStats.service_total}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {totalStats.service_total > 0
              ? Math.round((totalStats.service_completed / totalStats.service_total) * 100)
              : 0}
            % completed
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={18} className="text-green-600" />
            <p className="text-sm font-medium text-green-900">Area Pages</p>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {totalStats.area_completed}/{totalStats.area_total}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {totalStats.area_total > 0
              ? Math.round((totalStats.area_completed / totalStats.area_total) * 100)
              : 0}
            % completed
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Projects with Pending Pages</h3>
        {projects
          .filter((p) => {
            const pendingService = p.service_pages_total > p.service_pages_completed;
            const pendingArea = p.area_pages_total > p.area_pages_completed;
            return pendingService || pendingArea;
          })
          .slice(0, 5)
          .map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectClick(project.id)}
              className="border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate mb-1">{project.name}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {project.service_pages_total > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText size={14} className="text-blue-600" />
                        <span className="text-slate-600">
                          {project.service_pages_completed}/{project.service_pages_total} services
                        </span>
                      </div>
                    )}
                    {project.area_pages_total > 0 && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-green-600" />
                        <span className="text-slate-600">
                          {project.area_pages_completed}/{project.area_pages_total} areas
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 flex-shrink-0" />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, MapPin, Phone, Mail, FileText, CheckSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import { ChecklistSection } from './ChecklistSection';
import { ServicePagesSection } from './ServicePagesSection';
import { AreaPagesSection } from './AreaPagesSection';
import { ProjectHeader } from './ProjectHeader';

interface Project {
  id: string;
  name: string;
  domain: string;
  city: string;
  status: 'planning' | 'in_progress' | 'review' | 'launched';
  phone_number: string | null;
  email: string | null;
  domain_registered_date: string | null;
  launch_date: string | null;
  notes: string | null;
  assigned_to: string | null;
  industry_id: string | null;
  user: {
    full_name: string;
  } | null;
  industry: {
    name: string;
  } | null;
}

export function ProjectDetail({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'services' | 'areas'>('checklist');

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useRealtimeSubscription({
    table: 'projects',
    filter: `id=eq.${projectId}`,
    onChange: () => {
      loadProject();
    },
  });

  const loadProject = async () => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('*, user:assigned_to(full_name), industry:industry_id(name)')
        .eq('id', projectId)
        .single();

      if (data) {
        setProject(data as Project);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Project not found</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Projects</span>
      </button>

      <ProjectHeader project={project} onUpdate={loadProject} />

      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Project Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-slate-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-slate-500">City</p>
              <p className="font-medium text-slate-900 truncate">{project.city}</p>
            </div>
          </div>
          {project.phone_number && (
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-medium text-slate-900 truncate">{project.phone_number}</p>
              </div>
            </div>
          )}
          {project.email && (
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium text-slate-900 truncate">{project.email}</p>
              </div>
            </div>
          )}
          {project.domain_registered_date && (
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-500">Domain Registered</p>
                <p className="font-medium text-slate-900">
                  {new Date(project.domain_registered_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          {project.launch_date && (
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-slate-500">Website Launch Date</p>
                <p className="font-medium text-slate-900">
                  {new Date(project.launch_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {project.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={20} className="text-slate-400" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">Notes</h3>
          </div>
          <p className="text-slate-700 whitespace-pre-wrap">{project.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="border-b border-slate-200 overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === 'checklist'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckSquare size={18} />
              <span className="text-sm sm:text-base">Checklist</span>
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === 'services'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText size={18} />
              <span className="text-sm sm:text-base">Service Pages</span>
            </button>
            <button
              onClick={() => setActiveTab('areas')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === 'areas'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin size={18} />
              <span className="text-sm sm:text-base">Area Pages</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'checklist' && <ChecklistSection projectId={projectId} />}
          {activeTab === 'services' && <ServicePagesSection projectId={projectId} />}
          {activeTab === 'areas' && <AreaPagesSection projectId={projectId} />}
        </div>
      </div>
    </div>
  );
}

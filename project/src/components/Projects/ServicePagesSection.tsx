import { useEffect, useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

interface ServicePage {
  id: string;
  service_name: string;
  slug: string;
  is_completed: boolean;
  assigned_to: string | null;
  user: {
    full_name: string;
  } | null;
}

export function ServicePagesSection({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [services, setServices] = useState<ServicePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState('');

  useEffect(() => {
    loadServices();
  }, [projectId]);

  useRealtimeSubscription({
    table: 'service_pages',
    filter: `project_id=eq.${projectId}`,
    onChange: () => {
      loadServices();
    },
  });

  const loadServices = async () => {
    try {
      const { data } = await supabase
        .from('service_pages')
        .select('*, user:assigned_to(full_name)')
        .eq('project_id', projectId)
        .order('service_name');

      if (data) {
        setServices(data as ServicePage[]);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (service: ServicePage) => {
    const newStatus = !service.is_completed;

    try {
      await supabase
        .from('service_pages')
        .update({
          is_completed: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', service.id);

      await supabase.from('activity_log').insert({
        project_id: projectId,
        user_id: user!.id,
        action: `${newStatus ? 'Completed' : 'Uncompleted'} service page: ${service.service_name}`,
        entity_type: 'service_page',
        entity_id: service.id,
      });

      loadServices();
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.trim()) return;

    try {
      const slug = newService.toLowerCase().replace(/\s+/g, '-');

      await supabase.from('service_pages').insert({
        project_id: projectId,
        service_name: newService,
        slug,
        is_completed: false,
      });

      await supabase.from('activity_log').insert({
        project_id: projectId,
        user_id: user!.id,
        action: `Added service page: ${newService}`,
        entity_type: 'service_page',
      });

      setNewService('');
      setShowAddForm(false);
      loadServices();
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleDelete = async (service: ServicePage) => {
    if (!confirm(`Delete "${service.service_name}"?`)) return;

    try {
      await supabase.from('service_pages').delete().eq('id', service.id);

      await supabase.from('activity_log').insert({
        project_id: projectId,
        user_id: user!.id,
        action: `Deleted service page: ${service.service_name}`,
        entity_type: 'service_page',
      });

      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const completed = services.filter((s) => s.is_completed).length;
  const percentage = services.length > 0 ? Math.round((completed / services.length) * 100) : 0;

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">Service Pages</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              {completed} / {services.length}
            </span>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Add Service
            </button>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="flex gap-2 p-4 bg-slate-50 rounded-lg">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            placeholder="Service name (e.g., Termite Control)"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(false);
              setNewService('');
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="space-y-2">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            <button
              onClick={() => handleToggle(service)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                service.is_completed
                  ? 'bg-green-600 border-green-600'
                  : 'border-slate-300 group-hover:border-blue-500'
              }`}
            >
              {service.is_completed && <Check size={14} className="text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium ${
                  service.is_completed ? 'text-slate-400 line-through' : 'text-slate-900'
                }`}
              >
                {service.service_name}
              </p>
              <p className="text-xs text-slate-500">/{service.slug}</p>
            </div>
            <button
              onClick={() => handleDelete(service)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No service pages yet. Click "Add Service" to get started.
        </div>
      )}
    </div>
  );
}

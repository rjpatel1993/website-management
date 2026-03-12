import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface NewProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Industry {
  id: string;
  name: string;
  default_services: string[];
}

export function NewProjectModal({ onClose, onSuccess }: NewProjectModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    industry_id: '',
    city: '',
    phone_number: '',
    email: '',
    domain_registered_date: '',
    launch_date: '',
  });

  useEffect(() => {
    loadIndustries();
  }, []);

  const loadIndustries = async () => {
    const { data } = await supabase.from('industries').select('*').order('name');
    if (data) {
      setIndustries(data as Industry[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedIndustry = industries.find((i) => i.id === formData.industry_id);

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: formData.name,
          domain: formData.domain,
          industry: selectedIndustry?.name || '',
          industry_id: formData.industry_id,
          city: formData.city,
          phone_number: formData.phone_number || null,
          email: formData.email || null,
          domain_registered_date: formData.domain_registered_date || null,
          launch_date: formData.launch_date || null,
          status: 'planning',
          created_by: user?.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      if (project && selectedIndustry) {
        const servicePages = selectedIndustry.default_services.map((service: string) => ({
          project_id: project.id,
          service_name: service,
          slug: service.toLowerCase().replace(/\s+/g, '-'),
          is_completed: false,
        }));

        await supabase.from('service_pages').insert(servicePages);

        const { data: templates } = await supabase
          .from('checklist_templates')
          .select('*')
          .order('order_index');

        if (templates) {
          const tasks = templates.map((template) => ({
            project_id: project.id,
            category: template.category,
            title: template.title,
            description: template.description,
            order_index: template.order_index,
            is_completed: false,
          }));

          await supabase.from('checklist_items').insert(tasks);
        }

        await supabase.from('activity_log').insert({
          project_id: project.id,
          user_id: user!.id,
          action: `Created project "${formData.name}"`,
          entity_type: 'project',
          entity_id: project.id,
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error creating project:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">New Project</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Domain</label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="example.com"
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
            <select
              value={formData.industry_id}
              onChange={(e) => setFormData({ ...formData, industry_id: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select industry</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Domain Registered (Optional)
              </label>
              <input
                type="date"
                value={formData.domain_registered_date}
                onChange={(e) =>
                  setFormData({ ...formData, domain_registered_date: e.target.value })
                }
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Launch Date (Optional)
              </label>
              <input
                type="date"
                value={formData.launch_date}
                onChange={(e) => setFormData({ ...formData, launch_date: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Globe, CreditCard as Edit2, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ProjectHeaderProps {
  project: {
    id: string;
    name: string;
    domain: string;
    status: 'planning' | 'in_progress' | 'review' | 'launched';
    assigned_to: string | null;
    domain_registered_date: string | null;
    launch_date: string | null;
    notes: string | null;
    user: {
      full_name: string;
    } | null;
  };
  onUpdate: () => void;
}

const statusConfig = {
  planning: { label: 'Planning', color: 'bg-orange-100 text-orange-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'Review', color: 'bg-yellow-100 text-yellow-700' },
  launched: { label: 'Launched', color: 'bg-green-100 text-green-700' },
};

export function ProjectHeader({ project, onUpdate }: ProjectHeaderProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(project.status);
  const [assignedTo, setAssignedTo] = useState(project.assigned_to || '');
  const [domainRegisteredDate, setDomainRegisteredDate] = useState(
    project.domain_registered_date || ''
  );
  const [launchDate, setLaunchDate] = useState(project.launch_date || '');
  const [notes, setNotes] = useState(project.notes || '');
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; full_name: string }>>([]);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    const { data } = await supabase.from('users').select('id, full_name').order('full_name');
    if (data) {
      setTeamMembers(data);
    }
  };

  const handleSave = async () => {
    try {
      await supabase
        .from('projects')
        .update({
          status,
          assigned_to: assignedTo || null,
          domain_registered_date: domainRegisteredDate || null,
          launch_date: launchDate || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      await supabase.from('activity_log').insert({
        project_id: project.id,
        user_id: user!.id,
        action: `Updated project settings`,
        entity_type: 'project',
        entity_id: project.id,
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleCancel = () => {
    setStatus(project.status);
    setAssignedTo(project.assigned_to || '');
    setDomainRegisteredDate(project.domain_registered_date || '');
    setLaunchDate(project.launch_date || '');
    setNotes(project.notes || '');
    setIsEditing(false);
  };

  const currentStatus = statusConfig[project.status];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Globe size={18} />
            <span>{project.domain}</span>
          </div>
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="launched">Launched</option>
              </select>
              <button
                onClick={handleSave}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check size={18} />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={domainRegisteredDate ? domainRegisteredDate.split('T')[0] : ''}
                onChange={(e) => setDomainRegisteredDate(e.target.value)}
                placeholder="Domain Registered"
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input
                type="date"
                value={launchDate ? launchDate.split('T')[0] : ''}
                onChange={(e) => setLaunchDate(e.target.value)}
                placeholder="Launch Date"
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Project notes..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2">
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
            {project.user && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                  {project.user.full_name[0].toUpperCase()}
                </div>
                <span>{project.user.full_name}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  Check,
  Pencil,
  Trash2,
  Calendar,
  AlertCircle,
  MessageSquare,
  User,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';

type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'] & {
  user: { full_name: string } | null;
};

type User = Database['public']['Tables']['users']['Row'];

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onUpdate: () => void;
  projectId: string;
  teamMembers: User[];
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}

export function ChecklistItemRow({
  item,
  onUpdate,
  projectId,
  teamMembers,
  isSelected,
  onSelect,
}: ChecklistItemRowProps) {
  const { user: currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: item.title,
    description: item.description || '',
    priority: item.priority || '',
    due_date: item.due_date || '',
    assigned_to: item.assigned_to || '',
  });

  const handleToggle = async () => {
    const newStatus = !item.is_completed;

    await supabase
      .from('checklist_items')
      .update({
        is_completed: newStatus,
        completed_by: newStatus ? currentUser!.id : null,
        completed_at: newStatus ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    await supabase.from('activity_log').insert({
      project_id: projectId,
      user_id: currentUser!.id,
      action: `${newStatus ? 'Completed' : 'Uncompleted'} task: ${item.title}`,
      entity_type: 'task',
      entity_id: item.id,
    });

    onUpdate();
  };

  const handleSave = async () => {
    await supabase
      .from('checklist_items')
      .update({
        title: editData.title,
        description: editData.description || null,
        priority: editData.priority || null,
        due_date: editData.due_date || null,
        assigned_to: editData.assigned_to || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    await supabase.from('activity_log').insert({
      project_id: projectId,
      user_id: currentUser!.id,
      action: `Updated task: ${editData.title}`,
      entity_type: 'task',
      entity_id: item.id,
    });

    setIsEditing(false);
    onUpdate();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    await supabase.from('checklist_items').delete().eq('id', item.id);

    await supabase.from('activity_log').insert({
      project_id: projectId,
      user_id: currentUser!.id,
      action: `Deleted task: ${item.title}`,
      entity_type: 'task',
      entity_id: item.id,
    });

    onUpdate();
  };

  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && !item.is_completed;

  const priorityColors = {
    high: 'text-red-600 bg-red-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50',
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="space-y-3">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Task title"
          />
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Description (optional)"
          />
          <div className="grid grid-cols-3 gap-3">
            <select
              value={editData.priority}
              onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              type="date"
              value={editData.due_date ? editData.due_date.split('T')[0] : ''}
              onChange={(e) =>
                setEditData({ ...editData, due_date: e.target.value ? `${e.target.value}T00:00:00` : '' })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={editData.assigned_to}
              onChange={(e) => setEditData({ ...editData, assigned_to: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onSelect(e.target.checked)}
        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <button
        onClick={handleToggle}
        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          item.is_completed
            ? 'bg-green-600 border-green-600'
            : 'border-slate-300 group-hover:border-blue-500'
        }`}
      >
        {item.is_completed && <Check size={14} className="text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p
            className={`font-medium flex-1 ${
              item.is_completed ? 'text-slate-400 line-through' : 'text-slate-900'
            }`}
          >
            {item.title}
          </p>
          {item.priority && (
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                priorityColors[item.priority as keyof typeof priorityColors]
              }`}
            >
              {item.priority}
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-slate-500 mt-1">{item.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          {item.user && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{item.user.full_name}</span>
            </div>
          )}
          {item.due_date && (
            <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(item.due_date).toLocaleDateString()}</span>
              {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

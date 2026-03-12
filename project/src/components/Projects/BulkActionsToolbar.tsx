import { Trash2, Check, X, User, Calendar, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedIds: string[];
  projectId: string;
  teamMembers: User[];
  onClear: () => void;
  onComplete: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  selectedIds,
  projectId,
  teamMembers,
  onClear,
  onComplete,
}: BulkActionsToolbarProps) {
  const { user } = useAuth();
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} item(s)?`)) return;

    await supabase.from('checklist_items').delete().in('id', selectedIds);

    await supabase.from('activity_log').insert({
      project_id: projectId,
      user_id: user!.id,
      action: `Deleted ${selectedCount} task(s)`,
      entity_type: 'task',
      entity_id: null,
    });

    onComplete();
  };

  const handleBulkComplete = async (completed: boolean) => {
    await supabase
      .from('checklist_items')
      .update({
        is_completed: completed,
        completed_by: completed ? user!.id : null,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .in('id', selectedIds);

    await supabase.from('activity_log').insert({
      project_id: projectId,
      user_id: user!.id,
      action: `${completed ? 'Completed' : 'Uncompleted'} ${selectedCount} task(s)`,
      entity_type: 'task',
      entity_id: null,
    });

    onComplete();
  };

  const handleBulkAssign = async (assignedTo: string | null) => {
    await supabase
      .from('checklist_items')
      .update({
        assigned_to: assignedTo,
        updated_at: new Date().toISOString(),
      })
      .in('id', selectedIds);

    await supabase.from('activity_log').insert({
      project_id: projectId,
      user_id: user!.id,
      action: `Assigned ${selectedCount} task(s)`,
      entity_type: 'task',
      entity_id: null,
    });

    setShowAssignMenu(false);
    onComplete();
  };

  const handleBulkPriority = async (priority: 'high' | 'medium' | 'low' | null) => {
    await supabase
      .from('checklist_items')
      .update({
        priority,
        updated_at: new Date().toISOString(),
      })
      .in('id', selectedIds);

    await supabase.from('activity_log').insert({
      project_id: projectId,
      user_id: user!.id,
      action: `Set priority for ${selectedCount} task(s)`,
      entity_type: 'task',
      entity_id: null,
    });

    setShowPriorityMenu(false);
    onComplete();
  };

  return (
    <div className="sticky top-0 z-10 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{selectedCount} selected</span>
          <button
            onClick={onClear}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBulkComplete(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded hover:bg-blue-50 transition-colors text-sm"
          >
            <Check className="w-4 h-4" />
            Complete
          </button>

          <button
            onClick={() => handleBulkComplete(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded hover:bg-blue-50 transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            Incomplete
          </button>

          <div className="relative">
            <button
              onClick={() => setShowAssignMenu(!showAssignMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded hover:bg-blue-50 transition-colors text-sm"
            >
              <User className="w-4 h-4" />
              Assign
            </button>
            {showAssignMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 text-gray-900">
                <button
                  onClick={() => handleBulkAssign(null)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm"
                >
                  Unassign
                </button>
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleBulkAssign(member.id)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm"
                  >
                    {member.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 rounded hover:bg-blue-50 transition-colors text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              Priority
            </button>
            {showPriorityMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 text-gray-900">
                <button
                  onClick={() => handleBulkPriority(null)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm"
                >
                  None
                </button>
                <button
                  onClick={() => handleBulkPriority('high')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm text-red-600"
                >
                  High
                </button>
                <button
                  onClick={() => handleBulkPriority('medium')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm text-yellow-600"
                >
                  Medium
                </button>
                <button
                  onClick={() => handleBulkPriority('low')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm text-green-600"
                >
                  Low
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

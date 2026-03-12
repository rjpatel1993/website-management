import { useEffect, useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import { Database } from '../../lib/database.types';
import { ChecklistItemRow } from './ChecklistItemRow';
import { BulkActionsToolbar } from './BulkActionsToolbar';

type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'] & {
  user: { full_name: string } | null;
};

type User = Database['public']['Tables']['users']['Row'];

export function ChecklistSection({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'incomplete' | 'my-items'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [projectId]);

  useRealtimeSubscription({
    table: 'checklist_items',
    filter: `project_id=eq.${projectId}`,
    onChange: () => {
      loadData();
    },
  });

  const loadData = async () => {
    try {
      const [itemsResult, membersResult] = await Promise.all([
        supabase
          .from('checklist_items')
          .select('*, user:assigned_to(full_name)')
          .eq('project_id', projectId)
          .eq('is_active', true)
          .order('order_index'),
        supabase.from('users').select('*').order('full_name'),
      ]);

      if (itemsResult.data) setItems(itemsResult.data as ChecklistItem[]);
      if (membersResult.data) setTeamMembers(membersResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    const title = prompt('Enter task title:');
    if (!title?.trim()) return;

    const category = prompt('Enter category (e.g., Pre-Launch, Content, Technical):');
    if (!category?.trim()) return;

    const maxOrder = Math.max(...items.map((i) => i.order_index), 0);

    await supabase.from('checklist_items').insert({
      project_id: projectId,
      title: title.trim(),
      category: category.trim(),
      order_index: maxOrder + 1,
    });

    await supabase.from('activity_log').insert({
      project_id: projectId,
      user_id: user!.id,
      action: `Added task: ${title}`,
      entity_type: 'task',
      entity_id: null,
    });

    loadData();
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'completed' && item.is_completed) ||
      (filterStatus === 'incomplete' && !item.is_completed) ||
      (filterStatus === 'my-items' && item.assigned_to === user?.id);

    return matchesSearch && matchesStatus;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const handleSelectAll = (category: string, selected: boolean) => {
    const categoryItems = groupedItems[category];
    const newSelected = new Set(selectedItems);
    categoryItems.forEach((item) => {
      if (selected) {
        newSelected.add(item.id);
      } else {
        newSelected.delete(item.id);
      }
    });
    setSelectedItems(newSelected);
  };

  const handleSelectItem = (itemId: string, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading checklist...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Tasks</option>
          <option value="completed">Completed</option>
          <option value="incomplete">Incomplete</option>
          <option value="my-items">My Tasks</option>
        </select>
        <button
          onClick={handleAddItem}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {selectedItems.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedItems.size}
          selectedIds={Array.from(selectedItems)}
          projectId={projectId}
          teamMembers={teamMembers}
          onClear={() => setSelectedItems(new Set())}
          onComplete={() => {
            setSelectedItems(new Set());
            loadData();
          }}
        />
      )}

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const completed = categoryItems.filter((item) => item.is_completed).length;
          const total = categoryItems.length;
          const percentage = Math.round((completed / total) * 100);
          const allSelected = categoryItems.every((item) => selectedItems.has(item.id));

          return (
            <div key={category}>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(category, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      title="Select all in category"
                    />
                    <h3 className="text-lg font-semibold text-slate-900">{category}</h3>
                  </div>
                  <span className="text-sm text-slate-500">
                    {completed} / {total}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onUpdate={loadData}
                    projectId={projectId}
                    teamMembers={teamMembers}
                    isSelected={selectedItems.has(item.id)}
                    onSelect={(selected) => handleSelectItem(item.id, selected)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No tasks found. Add a new task to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

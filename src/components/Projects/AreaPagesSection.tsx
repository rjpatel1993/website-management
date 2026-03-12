import { useEffect, useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

interface AreaPage {
  id: string;
  area_name: string;
  slug: string;
  is_completed: boolean;
  assigned_to: string | null;
  user: {
    full_name: string;
  } | null;
}

export function AreaPagesSection({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [areas, setAreas] = useState<AreaPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newArea, setNewArea] = useState('');
  const [bulkAreas, setBulkAreas] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  useEffect(() => {
    loadAreas();
  }, [projectId]);

  useRealtimeSubscription({
    table: 'area_pages',
    filter: `project_id=eq.${projectId}`,
    onChange: () => {
      loadAreas();
    },
  });

  const loadAreas = async () => {
    try {
      const { data } = await supabase
        .from('area_pages')
        .select('*, user:assigned_to(full_name)')
        .eq('project_id', projectId)
        .order('area_name');

      if (data) {
        setAreas(data as AreaPage[]);
      }
    } catch (error) {
      console.error('Error loading areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (area: AreaPage) => {
    const newStatus = !area.is_completed;

    try {
      await supabase
        .from('area_pages')
        .update({
          is_completed: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', area.id);

      await supabase.from('activity_log').insert({
        project_id: projectId,
        user_id: user!.id,
        action: `${newStatus ? 'Completed' : 'Uncompleted'} area page: ${area.area_name}`,
        entity_type: 'area_page',
        entity_id: area.id,
      });

      loadAreas();
    } catch (error) {
      console.error('Error updating area:', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArea.trim()) return;

    try {
      const slug = newArea.toLowerCase().replace(/\s+/g, '-');

      await supabase.from('area_pages').insert({
        project_id: projectId,
        area_name: newArea,
        slug,
        is_completed: false,
      });

      await supabase.from('activity_log').insert({
        project_id: projectId,
        user_id: user!.id,
        action: `Added area page: ${newArea}`,
        entity_type: 'area_page',
      });

      setNewArea('');
      setShowAddForm(false);
      loadAreas();
    } catch (error) {
      console.error('Error adding area:', error);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkAreas.trim()) return;

    try {
      const areaNames = bulkAreas
        .split('\n')
        .map((a) => a.trim())
        .filter((a) => a);

      const areaPages = areaNames.map((name) => ({
        project_id: projectId,
        area_name: name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        is_completed: false,
      }));

      await supabase.from('area_pages').insert(areaPages);

      await supabase.from('activity_log').insert({
        project_id: projectId,
        user_id: user!.id,
        action: `Added ${areaNames.length} area pages in bulk`,
        entity_type: 'area_page',
      });

      setBulkAreas('');
      setShowBulkAdd(false);
      loadAreas();
    } catch (error) {
      console.error('Error bulk adding areas:', error);
    }
  };

  const handleDelete = async (area: AreaPage) => {
    if (!confirm(`Delete "${area.area_name}"?`)) return;

    try {
      await supabase.from('area_pages').delete().eq('id', area.id);

      await supabase.from('activity_log').insert({
        project_id: projectId,
        user_id: user!.id,
        action: `Deleted area page: ${area.area_name}`,
        entity_type: 'area_page',
      });

      loadAreas();
    } catch (error) {
      console.error('Error deleting area:', error);
    }
  };

  const handleToggleAll = async () => {
    const allCompleted = areas.every((a) => a.is_completed);
    const newStatus = !allCompleted;

    try {
      await Promise.all(
        areas.map((area) =>
          supabase
            .from('area_pages')
            .update({
              is_completed: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', area.id)
        )
      );

      await supabase.from('activity_log').insert({
        project_id: projectId,
        user_id: user!.id,
        action: `${newStatus ? 'Completed' : 'Uncompleted'} all area pages`,
        entity_type: 'area_page',
      });

      loadAreas();
    } catch (error) {
      console.error('Error toggling all areas:', error);
    }
  };

  const completed = areas.filter((a) => a.is_completed).length;
  const percentage = areas.length > 0 ? Math.round((completed / areas.length) * 100) : 0;
  const allCompleted = areas.length > 0 && areas.every((a) => a.is_completed);

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading areas...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">Area Pages</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              {completed} / {areas.length}
            </span>
            {areas.length > 0 && (
              <button
                onClick={handleToggleAll}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                {allCompleted ? 'Uncheck All' : 'Check All'}
              </button>
            )}
            <button
              onClick={() => setShowBulkAdd(true)}
              className="px-3 py-1.5 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Bulk Add
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Add Area
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
            value={newArea}
            onChange={(e) => setNewArea(e.target.value)}
            placeholder="Area name (e.g., Sydney CBD)"
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
              setNewArea('');
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      {showBulkAdd && (
        <form onSubmit={handleBulkAdd} className="p-4 bg-slate-50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enter area names (one per line)
            </label>
            <textarea
              value={bulkAreas}
              onChange={(e) => setBulkAreas(e.target.value)}
              placeholder="Sydney CBD&#10;Parramatta&#10;North Sydney&#10;Bondi"
              rows={6}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add All
            </button>
            <button
              type="button"
              onClick={() => {
                setShowBulkAdd(false);
                setBulkAreas('');
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {areas.map((area) => (
          <div
            key={area.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            <button
              onClick={() => handleToggle(area)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                area.is_completed
                  ? 'bg-green-600 border-green-600'
                  : 'border-slate-300 group-hover:border-blue-500'
              }`}
            >
              {area.is_completed && <Check size={14} className="text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm ${
                  area.is_completed ? 'text-slate-400 line-through' : 'text-slate-900'
                }`}
              >
                {area.area_name}
              </p>
            </div>
            <button
              onClick={() => handleDelete(area)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {areas.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No area pages yet. Click "Add Area" or "Bulk Add" to get started.
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';

type Industry = Database['public']['Tables']['industries']['Row'];

interface IndustryManagementProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function IndustryManagement({ onClose, onSuccess }: IndustryManagementProps) {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newIndustry, setNewIndustry] = useState({ name: '', description: '' });
  const [editingIndustry, setEditingIndustry] = useState({ name: '', description: '' });

  useEffect(() => {
    loadIndustries();
  }, []);

  const loadIndustries = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('industries').select('*').order('name');

    if (error) {
      console.error('Error loading industries:', error);
    }
    if (data) setIndustries(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newIndustry.name.trim()) return;

    const { error } = await supabase.from('industries').insert({
      name: newIndustry.name.trim(),
      description: newIndustry.description.trim() || null,
    });

    if (!error) {
      setNewIndustry({ name: '', description: '' });
      loadIndustries();
      onSuccess();
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingIndustry.name.trim()) return;

    const { error } = await supabase
      .from('industries')
      .update({
        name: editingIndustry.name.trim(),
        description: editingIndustry.description.trim() || null,
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      loadIndustries();
      onSuccess();
    }
  };

  const handleDelete = async (id: string, industryName: string) => {
    const { count } = await supabase
      .from('checklist_templates')
      .select('*', { count: 'exact', head: true })
      .eq('industry_id', id);

    if (count && count > 0) {
      if (
        !confirm(
          `This industry is used by ${count} template(s). Deleting it will affect those templates. Continue?`
        )
      ) {
        return;
      }
    }

    const { error } = await supabase.from('industries').delete().eq('id', id);

    if (!error) {
      loadIndustries();
      onSuccess();
    }
  };

  const startEdit = (industry: Industry) => {
    setEditingId(industry.id);
    setEditingIndustry({
      name: industry.name,
      description: industry.description || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingIndustry({ name: '', description: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Manage Industries</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Create New Industry</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={newIndustry.name}
                onChange={(e) => setNewIndustry({ ...newIndustry, name: e.target.value })}
                placeholder="Industry name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={newIndustry.description}
                onChange={(e) => setNewIndustry({ ...newIndustry, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleCreate}
                disabled={!newIndustry.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Industry
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Existing Industries</h3>
            {loading ? (
              <div className="text-center py-4 text-gray-600">Loading...</div>
            ) : industries.length === 0 ? (
              <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-lg">
                No industries yet. Create one above.
              </div>
            ) : (
              <div className="space-y-2">
                {industries.map((industry) => (
                  <div
                    key={industry.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {editingId === industry.id ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={editingIndustry.name}
                          onChange={(e) =>
                            setEditingIndustry({ ...editingIndustry, name: e.target.value })
                          }
                          className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editingIndustry.description}
                          onChange={(e) =>
                            setEditingIndustry({ ...editingIndustry, description: e.target.value })
                          }
                          placeholder="Description (optional)"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(industry.id)}
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{industry.name}</div>
                          {industry.description && (
                            <div className="text-sm text-gray-600 mt-1">{industry.description}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(industry)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(industry.id, industry.name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';

type Category = Database['public']['Tables']['checklist_categories']['Row'];

interface CategoryManagementProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryManagement({ onClose, onSuccess }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#6366f1' });
  const [editingCategory, setEditingCategory] = useState({ name: '', color: '#6366f1' });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('checklist_categories')
      .select('*')
      .order('order_index');
    if (data) setCategories(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newCategory.name.trim()) return;

    const maxOrder = Math.max(...categories.map((c) => c.order_index), 0);
    const { error } = await supabase.from('checklist_categories').insert({
      name: newCategory.name.trim(),
      color: newCategory.color,
      order_index: maxOrder + 1,
    });

    if (!error) {
      setNewCategory({ name: '', color: '#6366f1' });
      loadCategories();
      onSuccess();
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingCategory.name.trim()) return;

    const { error } = await supabase
      .from('checklist_categories')
      .update({
        name: editingCategory.name.trim(),
        color: editingCategory.color,
      })
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      loadCategories();
      onSuccess();
    }
  };

  const handleDelete = async (id: string, categoryName: string) => {
    const { count } = await supabase
      .from('checklist_templates')
      .select('*', { count: 'exact', head: true })
      .eq('category', categoryName);

    if (count && count > 0) {
      if (
        !confirm(
          `This category is used by ${count} template(s). Deleting it will affect those templates. Continue?`
        )
      ) {
        return;
      }
    }

    const { error } = await supabase.from('checklist_categories').delete().eq('id', id);

    if (!error) {
      loadCategories();
      onSuccess();
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingCategory({ name: category.name, color: category.color });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingCategory({ name: '', color: '#6366f1' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Manage Categories</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Create New Category</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Category name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
              />
              <button
                onClick={handleCreate}
                disabled={!newCategory.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Existing Categories</h3>
            {loading ? (
              <div className="text-center py-4 text-gray-600">Loading...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-lg">
                No categories yet. Create one above.
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />

                    {editingId === category.id ? (
                      <>
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, name: e.target.value })
                          }
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                        <input
                          type="color"
                          value={editingCategory.color}
                          onChange={(e) =>
                            setEditingCategory({ ...editingCategory, color: e.target.value })
                          }
                          className="h-8 w-12 rounded border border-gray-300 cursor-pointer"
                        />
                        <button
                          onClick={() => handleUpdate(category.id)}
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
                      </>
                    ) : (
                      <>
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="flex-1 font-medium text-gray-900">{category.name}</span>
                        <button
                          onClick={() => startEdit(category)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id, category.name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

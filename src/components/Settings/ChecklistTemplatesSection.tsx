import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { TemplateForm } from './TemplateForm';
import { CategoryManagement } from './CategoryManagement';
import { IndustryManagement } from './IndustryManagement';

type Template = Database['public']['Tables']['checklist_templates']['Row'];
type Industry = Database['public']['Tables']['industries']['Row'];

export function ChecklistTemplatesSection() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showIndustryManagement, setShowIndustryManagement] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [templatesResult, industriesResult] = await Promise.all([
      supabase.from('checklist_templates').select('*').order('category').order('order_index'),
      supabase.from('industries').select('*').order('name'),
    ]);

    if (templatesResult.error) {
      console.error('Error loading templates:', templatesResult.error);
    }
    if (industriesResult.error) {
      console.error('Error loading industries:', industriesResult.error);
    }

    if (templatesResult.data) setTemplates(templatesResult.data);
    if (industriesResult.data) setIndustries(industriesResult.data);
    setLoading(false);
  };

  const handleToggleActive = async (template: Template) => {
    const { error } = await supabase
      .from('checklist_templates')
      .update({ is_active: !template.is_active })
      .eq('id', template.id);

    if (!error) {
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    const { error } = await supabase.from('checklist_templates').delete().eq('id', id);

    if (!error) {
      loadData();
    }
  };

  const handleDuplicate = async (template: Template) => {
    const { error } = await supabase.from('checklist_templates').insert({
      title: `${template.title} (Copy)`,
      description: template.description,
      category: template.category,
      order_index: template.order_index,
      industry_id: template.industry_id,
      color: template.color,
      is_active: false,
    });

    if (!error) {
      loadData();
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTemplate(null);
    loadData();
  };

  const filteredTemplates = templates.filter((template) => {
    const industryMatch =
      selectedIndustry === 'all' ||
      (selectedIndustry === 'none' && !template.industry_id) ||
      template.industry_id === selectedIndustry;

    const categoryMatch = selectedCategory === 'all' || template.category === selectedCategory;

    return industryMatch && categoryMatch;
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  const categories = Array.from(new Set(templates.map((t) => t.category))).sort();

  if (loading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Checklist Templates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage reusable checklist templates for your projects
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryManagement(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Manage Categories
          </button>
          <button
            onClick={() => setShowIndustryManagement(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Manage Industries
          </button>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Industry</label>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Industries</option>
            <option value="none">Universal Templates</option>
            {industries.map((industry) => (
              <option key={industry.id} value={industry.id}>
                {industry.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          <div key={category} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
            <div className="space-y-2">
              {categoryTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white rounded-lg p-4 border border-gray-200 ${
                    !template.is_active ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{template.title}</h4>
                        {template.color && (
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: template.color }}
                          />
                        )}
                        {!template.is_active && (
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      )}
                      {template.industry_id && (
                        <p className="text-xs text-gray-500 mt-2">
                          Industry:{' '}
                          {industries.find((i) => i.id === template.industry_id)?.name ||
                            'Unknown'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleActive(template)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title={template.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {template.is_active ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDuplicate(template)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowForm(true);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No templates found. Create your first template to get started.</p>
          </div>
        )}
      </div>

      {showForm && (
        <TemplateForm
          template={editingTemplate}
          industries={industries}
          onClose={() => {
            setShowForm(false);
            setEditingTemplate(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {showCategoryManagement && (
        <CategoryManagement
          onClose={() => setShowCategoryManagement(false)}
          onSuccess={loadData}
        />
      )}

      {showIndustryManagement && (
        <IndustryManagement
          onClose={() => setShowIndustryManagement(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

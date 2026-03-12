import { useEffect, useState } from 'react';
import { Plus, Search, Filter, MapPin, Briefcase, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import { ProjectCard } from './ProjectCard';
import { NewProjectModal } from './NewProjectModal';

interface Project {
  id: string;
  name: string;
  domain: string;
  city: string;
  industry: string;
  status: 'planning' | 'in_progress' | 'review' | 'launched';
  assigned_to: string | null;
  service_pages_count: number;
  area_pages_count: number;
  launch_date: string | null;
  created_at: string;
  user: {
    full_name: string;
  } | null;
  industries: {
    name: string;
  } | null;
}

export function ProjectsList({ onSelectProject }: { onSelectProject: (id: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [launchMonthFilter, setLaunchMonthFilter] = useState<string>('all');
  const [cities, setCities] = useState<string[]>([]);
  const [industries, setIndustries] = useState<Array<{ id: string; name: string }>>([]);
  const [launchMonths, setLaunchMonths] = useState<string[]>([]);

  useEffect(() => {
    loadProjects();
    loadIndustries();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, statusFilter, cityFilter, industryFilter, launchMonthFilter]);

  useRealtimeSubscription({
    table: 'projects',
    onChange: () => {
      loadProjects();
    },
  });

  const loadProjects = async () => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('*, user:assigned_to(full_name), industries(name)')
        .order('created_at', { ascending: false });

      if (data) {
        setProjects(data as Project[]);

        const uniqueCities = Array.from(new Set(data.map(p => p.city).filter(Boolean))).sort();
        setCities(uniqueCities);

        // Extract unique launch months
        const months = data
          .filter(p => p.launch_date)
          .map(p => {
            const date = new Date(p.launch_date!);
            return `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
          });
        const uniqueMonths = Array.from(new Set(months)).sort((a, b) => {
          const dateA = new Date(a);
          const dateB = new Date(b);
          return dateB.getTime() - dateA.getTime();
        });
        setLaunchMonths(uniqueMonths);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIndustries = async () => {
    try {
      const { data } = await supabase
        .from('industries')
        .select('id, name')
        .order('name');

      if (data) {
        setIndustries(data);
      }
    } catch (error) {
      console.error('Error loading industries:', error);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (cityFilter !== 'all') {
      filtered = filtered.filter((p) => p.city === cityFilter);
    }

    if (industryFilter !== 'all') {
      filtered = filtered.filter((p) => {
        const industryName = p.industries?.name || p.industry;
        return industryName === industryFilter;
      });
    }

    if (launchMonthFilter !== 'all') {
      filtered = filtered.filter((p) => {
        if (!p.launch_date) return false;
        const date = new Date(p.launch_date);
        const monthYear = `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
        return monthYear === launchMonthFilter;
      });
    }

    setFilteredProjects(filtered);
  };

  const handleProjectCreated = () => {
    setShowNewModal(false);
    loadProjects();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Projects</h1>
          <p className="text-sm sm:text-base text-slate-600">Manage your website launches</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>New Project</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-3">
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="launched">Launched</option>
            </select>
          </div>
          <div className="relative">
            <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Briefcase size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Industries</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.name}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Calendar size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={launchMonthFilter}
              onChange={(e) => setLaunchMonthFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Launch Dates</option>
              {launchMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <p className="text-sm sm:text-base text-slate-500">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onSelectProject(project.id)}
            />
          ))}
        </div>
      )}

      {showNewModal && (
        <NewProjectModal
          onClose={() => setShowNewModal(false)}
          onSuccess={handleProjectCreated}
        />
      )}
    </div>
  );
}

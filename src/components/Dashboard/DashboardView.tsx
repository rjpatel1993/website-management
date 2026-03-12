import { useEffect, useState } from 'react';
import { FolderKanban, CheckCircle, Clock, Rocket } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import { StatsCard } from './StatsCard';
import { ProjectProgressOverview } from './ProjectProgressOverview';
import { TaskPriorityDashboard } from './TaskPriorityDashboard';
import { PagesTrackingOverview } from './PagesTrackingOverview';

interface Stats {
  total: number;
  planning: number;
  inProgress: number;
  launched: number;
}

export function DashboardView({ onProjectClick }: { onProjectClick: (id: string) => void }) {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    planning: 0,
    inProgress: 0,
    launched: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  useRealtimeSubscription({
    table: 'projects',
    onChange: () => {
      loadStats();
    },
  });

  const loadStats = async () => {
    try {
      const { data: projects } = await supabase.from('projects').select('status');

      if (projects) {
        const stats = {
          total: projects.length,
          planning: projects.filter((p) => p.status === 'planning').length,
          inProgress: projects.filter((p) => p.status === 'in_progress').length,
          launched: projects.filter((p) => p.status === 'launched').length,
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-slate-600">Overview of your website launches</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard title="Total Projects" value={stats.total} icon={FolderKanban} color="blue" />
        <StatsCard title="Planning" value={stats.planning} icon={Clock} color="orange" />
        <StatsCard title="In Progress" value={stats.inProgress} icon={CheckCircle} color="blue" />
        <StatsCard title="Launched" value={stats.launched} icon={Rocket} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectProgressOverview onProjectClick={onProjectClick} />
        <TaskPriorityDashboard onProjectClick={onProjectClick} />
      </div>

      <PagesTrackingOverview onProjectClick={onProjectClick} />
    </div>
  );
}

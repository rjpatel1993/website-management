import { useEffect, useState } from 'react';
import { AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

interface TaskStats {
  overdue_count: number;
  high_priority_count: number;
  due_this_week_count: number;
  total_incomplete: number;
  total_completed: number;
  completion_rate: number;
}

export function TaskPriorityDashboard({ onProjectClick }: { onProjectClick: (id: string) => void }) {
  const [stats, setStats] = useState<TaskStats>({
    overdue_count: 0,
    high_priority_count: 0,
    due_this_week_count: 0,
    total_incomplete: 0,
    total_completed: 0,
    completion_rate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaskStats();
  }, []);

  useRealtimeSubscription({
    table: 'checklist_items',
    onChange: () => {
      loadTaskStats();
    },
  });

  const loadTaskStats = async () => {
    try {
      const now = new Date();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);

      const { data: allTasks } = await supabase
        .from('checklist_items')
        .select('id, is_completed, due_date, priority')
        .eq('is_active', true);

      if (allTasks) {
        const incompleteTasks = allTasks.filter((t) => !t.is_completed);
        const completedTasks = allTasks.filter((t) => t.is_completed);

        const overdue_count = incompleteTasks.filter((t) => {
          if (!t.due_date) return false;
          return new Date(t.due_date) < now;
        }).length;

        const high_priority_count = incompleteTasks.filter((t) => t.priority === 'high').length;

        const due_this_week_count = incompleteTasks.filter((t) => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          return dueDate >= now && dueDate <= endOfWeek;
        }).length;

        const total_incomplete = incompleteTasks.length;
        const total_completed = completedTasks.length;
        const total = allTasks.length;
        const completion_rate = total > 0 ? Math.round((total_completed / total) * 100) : 0;

        setStats({
          overdue_count,
          high_priority_count,
          due_this_week_count,
          total_incomplete,
          total_completed,
          completion_rate,
        });
      }
    } catch (error) {
      console.error('Error loading task stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Task Priority</h2>
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle size={24} className="text-orange-600" />
        <h2 className="text-lg font-semibold text-slate-900">Task Priority</h2>
      </div>

      <div className="space-y-4">
        {stats.overdue_count > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Clock size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">Overdue Tasks</p>
                  <p className="text-sm text-red-600">Requires immediate attention</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.overdue_count}</div>
            </div>
          </div>
        )}

        {stats.high_priority_count > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-orange-900">High Priority</p>
                  <p className="text-sm text-orange-600">Important tasks pending</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600">{stats.high_priority_count}</div>
            </div>
          </div>
        )}

        {stats.due_this_week_count > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Due This Week</p>
                  <p className="text-sm text-blue-600">Upcoming deadlines</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.due_this_week_count}</div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Overall Progress</p>
              <p className="text-sm text-slate-600">
                {stats.total_completed} completed · {stats.total_incomplete} remaining
              </p>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.completion_rate}%</div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.completion_rate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

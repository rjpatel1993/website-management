import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

interface Activity {
  id: string;
  action: string;
  created_at: string;
  user: {
    full_name: string;
  } | null;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  useRealtimeSubscription({
    table: 'activity_log',
    onChange: () => {
      loadActivities();
    },
  });

  const loadActivities = async () => {
    try {
      const { data } = await supabase
        .from('activity_log')
        .select('id, action, created_at, user:users(full_name)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setActivities(data as Activity[]);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock size={20} className="text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading activity...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No recent activity</div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                {activity.user?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900">{activity.action}</p>
                <p className="text-xs text-slate-500 mt-1">{formatTime(activity.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

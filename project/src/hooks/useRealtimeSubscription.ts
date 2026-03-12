import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeSubscriptionOptions {
  table: string;
  event?: RealtimeEvent;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
}

export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseRealtimeSubscriptionOptions) {
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = () => {
      const channelName = filter ? `${table}:${filter}` : table;

      channel = supabase.channel(channelName);

      let subscription = channel.on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          if (onChange) {
            onChange(payload);
          }

          switch (payload.eventType) {
            case 'INSERT':
              if (onInsert) onInsert(payload);
              break;
            case 'UPDATE':
              if (onUpdate) onUpdate(payload);
              break;
            case 'DELETE':
              if (onDelete) onDelete(payload);
              break;
          }
        }
      );

      subscription.subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, event, filter, onInsert, onUpdate, onDelete, onChange]);
}

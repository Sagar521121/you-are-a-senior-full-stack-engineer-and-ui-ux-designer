import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type EventSettings = Database['public']['Tables']['event_settings']['Row'];

export const useEventSettings = () => {
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('event_settings')
        .select('*')
        .limit(1)
        .single();
      
      setEventSettings(data);
      setLoading(false);
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (!eventSettings?.prom_date) return;

    const calculateTimeLeft = () => {
      const promDate = new Date(eventSettings.prom_date);
      const now = new Date();
      const difference = promDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [eventSettings]);

  const isEventActive = eventSettings?.is_active && 
    (eventSettings?.prom_date ? new Date(eventSettings.prom_date) > new Date() : false);

  return { eventSettings, loading, timeLeft, isEventActive };
};

import { useEventSettings } from '@/hooks/useEventSettings';
import { Sparkles, Clock } from 'lucide-react';

export const CountdownTimer = () => {
  const { timeLeft, loading } = useEventSettings();

  if (loading || !timeLeft) return null;

  const timeUnits = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' }
  ];

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl gradient-secondary border border-border/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">Prom Night Countdown</span>
        <Sparkles className="w-4 h-4 text-accent" />
      </div>
      <div className="flex gap-3">
        {timeUnits.map((unit, index) => (
          <div key={unit.label} className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-xl bg-card shadow-card flex items-center justify-center">
              <span className="text-xl font-bold text-gradient">{unit.value}</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

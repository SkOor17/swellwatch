import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDirection } from '../utils/direction';

interface DirectionIndicatorProps {
  degrees: number;
  label?: string;
  className?: string;
  iconClassName?: string;
}

export function DirectionIndicator({
  degrees,
  label,
  className,
  iconClassName,
}: DirectionIndicatorProps) {
  const formatted = formatDirection(degrees);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium',
        className
      )}
      data-testid="direction-indicator"
    >
      {label && <span className="text-slate-500 font-normal">{label} :</span>}
      <div
        data-testid="direction-arrow"
        className="inline-flex items-center justify-center transition-transform duration-200"
        style={{ transform: `rotate(${Math.round(degrees)}deg)` }}
      >
        <ArrowUp className={cn('h-3.5 w-3.5 text-blue-600', iconClassName)} />
      </div>
      <span>{formatted}</span>
    </div>
  );
}

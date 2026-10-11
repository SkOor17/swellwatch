import { LEVEL_CONFIG } from '../constants';
import type { LevelInfo, SurfSkillLevel } from '../types';

export function getLevelInfo(level?: string | null): LevelInfo {
  if (!level) {
    return {
      label: 'Non défini',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }
  const normalized = level.toLowerCase().trim() as SurfSkillLevel;
  return (
    LEVEL_CONFIG[normalized] ?? {
      label: level,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    }
  );
}

export function getScoreBadgeClass(score?: number | null): string {
  if (score === undefined || score === null) {
    return 'bg-slate-100 text-slate-600 border-slate-200';
  }
  if (score >= 7.5) {
    return 'bg-emerald-600 text-white border-emerald-700';
  }
  if (score >= 5.0) {
    return 'bg-amber-500 text-white border-amber-600';
  }
  if (score >= 3.0) {
    return 'bg-orange-500 text-white border-orange-600';
  }
  return 'bg-rose-500 text-white border-rose-600';
}

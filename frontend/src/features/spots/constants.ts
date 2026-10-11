import type { LevelInfo, SurfSkillLevel } from './types';

export const LEVEL_CONFIG: Record<SurfSkillLevel, LevelInfo> = {
  flat: {
    label: 'Non praticable',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  beginner: {
    label: 'Débutant',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  intermediate: {
    label: 'Intermédiaire',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  advanced: {
    label: 'Avancé',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  expert: {
    label: 'Expert',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
};


export type Level = 'Seedling' | 'Eco Warrior' | 'Climate Champion' | 'Planet Guardian';

export const LEVEL_CONFIG: Record<Level, { min: number; max: number; color: string }> = {
  'Seedling': { min: 0, max: 100, color: '#39F3BB' },
  'Eco Warrior': { min: 101, max: 500, color: '#31C352' },
  'Climate Champion': { min: 501, max: 1000, color: '#1a4035' },
  'Planet Guardian': { min: 1001, max: Infinity, color: '#52d9a9' }
};

export function getLevelFromPoints(points: number): Level {
  if (points <= 100) return 'Seedling';
  if (points <= 500) return 'Eco Warrior';
  if (points <= 1000) return 'Climate Champion';
  return 'Planet Guardian';
}

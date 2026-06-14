
export interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: string;
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'challenge-1',
    title: 'Seedling Walk',
    description: 'Walk for 7 consecutive days to build a sustainable habit.',
    reward: 100,
    icon: 'Footprints'
  },
  {
    id: 'challenge-2',
    title: 'Commute Commando',
    description: 'Use public transport 5 times this week instead of driving.',
    reward: 150,
    icon: 'Bus'
  },
  {
    id: 'challenge-3',
    title: 'Watt Watcher',
    description: 'Reduce non-essential electricity usage for 7 consecutive days.',
    reward: 200,
    icon: 'Zap'
  }
];

export function getNextChallenge(completedIds: string[] = []): Challenge | null {
  return CHALLENGES.find(c => !completedIds.includes(c.id)) || null;
}

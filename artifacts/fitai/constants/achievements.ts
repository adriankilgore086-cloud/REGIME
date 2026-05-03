export type BadgeRarity = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
export type BadgeCategory = 'consistency' | 'strength' | 'progression' | 'elite' | 'social' | 'special';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  icon: string;
  xpReward: number;
  criteria: {
    type: 'streak' | 'workouts' | 'calories' | 'xp' | 'level' | 'custom';
    value: number;
  };
}

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#F3D27A',
  platinum: '#8FB8FF',
  legendary: '#FF2D78',
};

export const RARITY_GLOW: Record<BadgeRarity, string> = {
  bronze: '#CD7F3240',
  silver: '#C0C0C040',
  gold: '#F3D27A40',
  platinum: '#8FB8FF40',
  legendary: '#FF2D7840',
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'a1',
    name: 'First Step',
    description: 'Complete your first workout',
    rarity: 'bronze',
    category: 'progression',
    icon: 'star',
    xpReward: 50,
    criteria: { type: 'workouts', value: 1 },
  },
  {
    id: 'a2',
    name: 'Getting Warmed Up',
    description: 'Complete 5 workouts',
    rarity: 'bronze',
    category: 'progression',
    icon: 'flame',
    xpReward: 100,
    criteria: { type: 'workouts', value: 5 },
  },
  {
    id: 'a3',
    name: 'Gym Rat',
    description: 'Complete 25 workouts',
    rarity: 'silver',
    category: 'progression',
    icon: 'barbell',
    xpReward: 250,
    criteria: { type: 'workouts', value: 25 },
  },
  {
    id: 'a4',
    name: 'Iron Discipline',
    description: 'Complete 100 workouts',
    rarity: 'gold',
    category: 'consistency',
    icon: 'trophy',
    xpReward: 500,
    criteria: { type: 'workouts', value: 100 },
  },
  {
    id: 'a5',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    rarity: 'bronze',
    category: 'consistency',
    icon: 'calendar',
    xpReward: 150,
    criteria: { type: 'streak', value: 7 },
  },
  {
    id: 'a6',
    name: '30-Day Streak',
    description: 'Train 30 days in a row',
    rarity: 'gold',
    category: 'consistency',
    icon: 'flash',
    xpReward: 750,
    criteria: { type: 'streak', value: 30 },
  },
  {
    id: 'a7',
    name: 'Century Streak',
    description: 'Train 100 days in a row',
    rarity: 'legendary',
    category: 'consistency',
    icon: 'infinite',
    xpReward: 2500,
    criteria: { type: 'streak', value: 100 },
  },
  {
    id: 'a8',
    name: 'Calorie Crusher',
    description: 'Burn 10,000 total calories',
    rarity: 'silver',
    category: 'progression',
    icon: 'bonfire',
    xpReward: 300,
    criteria: { type: 'calories', value: 10000 },
  },
  {
    id: 'a9',
    name: 'Inferno',
    description: 'Burn 50,000 total calories',
    rarity: 'gold',
    category: 'elite',
    icon: 'nuclear',
    xpReward: 1000,
    criteria: { type: 'calories', value: 50000 },
  },
  {
    id: 'a10',
    name: 'Level 10',
    description: 'Reach level 10',
    rarity: 'silver',
    category: 'progression',
    icon: 'ribbon',
    xpReward: 400,
    criteria: { type: 'level', value: 10 },
  },
  {
    id: 'a11',
    name: 'Elite Status',
    description: 'Reach level 25',
    rarity: 'platinum',
    category: 'elite',
    icon: 'diamond',
    xpReward: 1500,
    criteria: { type: 'level', value: 25 },
  },
  {
    id: 'a12',
    name: 'Legendary',
    description: 'Reach level 50',
    rarity: 'legendary',
    category: 'elite',
    icon: 'planet',
    xpReward: 5000,
    criteria: { type: 'level', value: 50 },
  },
];

export function checkAchievements(
  stats: { totalWorkouts: number; streak: number; caloriesBurned: number; level: number },
  earnedIds: string[]
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => {
    if (earnedIds.includes(a.id)) return false;
    const { type, value } = a.criteria;
    switch (type) {
      case 'workouts': return stats.totalWorkouts >= value;
      case 'streak': return stats.streak >= value;
      case 'calories': return stats.caloriesBurned >= value;
      case 'level': return stats.level >= value;
      default: return false;
    }
  });
}

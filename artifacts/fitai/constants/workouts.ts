export type WorkoutCategory = 'strength' | 'cardio' | 'hiit' | 'recovery' | 'running';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number | string;
  duration?: number;
  restSeconds: number;
  targetMuscles: string[];
}

export interface Workout {
  id: string;
  name: string;
  category: WorkoutCategory;
  difficulty: DifficultyLevel;
  durationMinutes: number;
  calories: number;
  exercises: Exercise[];
  targetMuscles: string[];
  recoveryDays: number;
  xpReward: number;
  description: string;
}

export const CATEGORY_COLORS: Record<WorkoutCategory, string> = {
  strength: '#00D4FF',
  cardio: '#FF2D78',
  hiit: '#FFB800',
  recovery: '#00E5A0',
  running: '#7B2FBE',
};

export const CATEGORY_GRADIENTS: Record<WorkoutCategory, [string, string]> = {
  strength: ['#00D4FF22', '#00D4FF05'],
  cardio: ['#FF2D7822', '#FF2D7805'],
  hiit: ['#FFB80022', '#FFB80005'],
  recovery: ['#00E5A022', '#00E5A005'],
  running: ['#7B2FBE22', '#7B2FBE05'],
};

export const SAMPLE_WORKOUTS: Workout[] = [
  {
    id: 'w1',
    name: 'Power Upper Body',
    category: 'strength',
    difficulty: 'intermediate',
    durationMinutes: 45,
    calories: 420,
    xpReward: 150,
    description: 'Build upper body strength with compound movements',
    targetMuscles: ['Chest', 'Back', 'Shoulders', 'Triceps', 'Biceps'],
    recoveryDays: 2,
    exercises: [
      { id: 'e1', name: 'Bench Press', sets: 4, reps: 8, restSeconds: 90, targetMuscles: ['Chest', 'Triceps'] },
      { id: 'e2', name: 'Pull-Ups', sets: 3, reps: 10, restSeconds: 90, targetMuscles: ['Back', 'Biceps'] },
      { id: 'e3', name: 'Military Press', sets: 3, reps: 10, restSeconds: 75, targetMuscles: ['Shoulders'] },
      { id: 'e4', name: 'Barbell Rows', sets: 4, reps: 8, restSeconds: 90, targetMuscles: ['Back'] },
      { id: 'e5', name: 'Tricep Dips', sets: 3, reps: 12, restSeconds: 60, targetMuscles: ['Triceps'] },
    ],
  },
  {
    id: 'w2',
    name: 'Leg Day Destroyer',
    category: 'strength',
    difficulty: 'advanced',
    durationMinutes: 55,
    calories: 520,
    xpReward: 200,
    description: 'Complete lower body devastation',
    targetMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
    recoveryDays: 2,
    exercises: [
      { id: 'e6', name: 'Back Squat', sets: 5, reps: 5, restSeconds: 120, targetMuscles: ['Quads', 'Glutes'] },
      { id: 'e7', name: 'Romanian Deadlift', sets: 4, reps: 8, restSeconds: 90, targetMuscles: ['Hamstrings'] },
      { id: 'e8', name: 'Leg Press', sets: 3, reps: 12, restSeconds: 75, targetMuscles: ['Quads'] },
      { id: 'e9', name: 'Walking Lunges', sets: 3, reps: '12 each', restSeconds: 60, targetMuscles: ['Quads', 'Glutes'] },
      { id: 'e10', name: 'Calf Raises', sets: 4, reps: 15, restSeconds: 45, targetMuscles: ['Calves'] },
    ],
  },
  {
    id: 'w3',
    name: 'HIIT Inferno',
    category: 'hiit',
    difficulty: 'advanced',
    durationMinutes: 30,
    calories: 480,
    xpReward: 180,
    description: 'High-intensity intervals to torch fat fast',
    targetMuscles: ['Full Body', 'Core', 'Cardiovascular'],
    recoveryDays: 1,
    exercises: [
      { id: 'e11', name: 'Burpees', sets: 4, reps: '30s on / 15s off', restSeconds: 30, targetMuscles: ['Full Body'] },
      { id: 'e12', name: 'Mountain Climbers', sets: 4, reps: '30s on / 15s off', restSeconds: 30, targetMuscles: ['Core', 'Shoulders'] },
      { id: 'e13', name: 'Jump Squats', sets: 4, reps: '30s on / 15s off', restSeconds: 30, targetMuscles: ['Quads', 'Glutes'] },
      { id: 'e14', name: 'Box Jumps', sets: 4, reps: '30s on / 15s off', restSeconds: 30, targetMuscles: ['Legs', 'Core'] },
    ],
  },
  {
    id: 'w4',
    name: 'Cardio Blast',
    category: 'cardio',
    difficulty: 'intermediate',
    durationMinutes: 35,
    calories: 380,
    xpReward: 120,
    description: 'Steady-state cardio for endurance building',
    targetMuscles: ['Cardiovascular', 'Legs', 'Core'],
    recoveryDays: 1,
    exercises: [
      { id: 'e15', name: 'Treadmill Run', sets: 1, reps: '20 min', duration: 1200, restSeconds: 0, targetMuscles: ['Legs', 'Cardiovascular'] },
      { id: 'e16', name: 'Jump Rope', sets: 5, reps: '2 min', restSeconds: 30, targetMuscles: ['Full Body'] },
      { id: 'e17', name: 'Cycling', sets: 1, reps: '10 min', duration: 600, restSeconds: 0, targetMuscles: ['Legs', 'Cardiovascular'] },
    ],
  },
  {
    id: 'w5',
    name: 'Active Recovery',
    category: 'recovery',
    difficulty: 'beginner',
    durationMinutes: 30,
    calories: 150,
    xpReward: 80,
    description: 'Restore mobility and reduce soreness',
    targetMuscles: ['Full Body', 'Flexibility'],
    recoveryDays: 0,
    exercises: [
      { id: 'e18', name: 'Foam Rolling', sets: 1, reps: '5 min', duration: 300, restSeconds: 0, targetMuscles: ['Full Body'] },
      { id: 'e19', name: 'Pigeon Pose', sets: 2, reps: '60s each', restSeconds: 30, targetMuscles: ['Hips', 'Glutes'] },
      { id: 'e20', name: 'Cat-Cow Stretch', sets: 3, reps: 10, restSeconds: 30, targetMuscles: ['Spine'] },
      { id: 'e21', name: 'Child\'s Pose', sets: 2, reps: '45s', restSeconds: 30, targetMuscles: ['Back', 'Hips'] },
    ],
  },
  {
    id: 'w6',
    name: '5K Morning Run',
    category: 'running',
    difficulty: 'intermediate',
    durationMinutes: 28,
    calories: 340,
    xpReward: 130,
    description: 'Pace yourself for a strong 5K finish',
    targetMuscles: ['Legs', 'Cardiovascular', 'Core'],
    recoveryDays: 1,
    exercises: [
      { id: 'e22', name: 'Warm-Up Walk', sets: 1, reps: '3 min', duration: 180, restSeconds: 0, targetMuscles: ['Legs'] },
      { id: 'e23', name: '5K Run', sets: 1, reps: '~25 min', duration: 1500, restSeconds: 0, targetMuscles: ['Legs', 'Cardiovascular'] },
    ],
  },
  {
    id: 'w7',
    name: 'Core Crusher',
    category: 'strength',
    difficulty: 'intermediate',
    durationMinutes: 25,
    calories: 200,
    xpReward: 100,
    description: 'Build a rock-solid core from all angles',
    targetMuscles: ['Core', 'Abs', 'Obliques', 'Lower Back'],
    recoveryDays: 1,
    exercises: [
      { id: 'e24', name: 'Plank', sets: 4, reps: '60s', restSeconds: 45, targetMuscles: ['Core'] },
      { id: 'e25', name: 'Russian Twists', sets: 3, reps: 20, restSeconds: 45, targetMuscles: ['Obliques'] },
      { id: 'e26', name: 'Hanging Leg Raises', sets: 3, reps: 12, restSeconds: 60, targetMuscles: ['Abs'] },
      { id: 'e27', name: 'Dead Bug', sets: 3, reps: '10 each', restSeconds: 45, targetMuscles: ['Core'] },
    ],
  },
  {
    id: 'w8',
    name: 'Elite Push Protocol',
    category: 'strength',
    difficulty: 'elite',
    durationMinutes: 60,
    calories: 580,
    xpReward: 300,
    description: 'Elite-level chest and tricep hypertrophy',
    targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
    recoveryDays: 3,
    exercises: [
      { id: 'e28', name: 'Incline Barbell Press', sets: 5, reps: 5, restSeconds: 150, targetMuscles: ['Upper Chest'] },
      { id: 'e29', name: 'Flat Dumbbell Flys', sets: 4, reps: 12, restSeconds: 90, targetMuscles: ['Chest'] },
      { id: 'e30', name: 'Cable Crossover', sets: 3, reps: 15, restSeconds: 60, targetMuscles: ['Chest'] },
      { id: 'e31', name: 'Skull Crushers', sets: 4, reps: 10, restSeconds: 75, targetMuscles: ['Triceps'] },
      { id: 'e32', name: 'Overhead Tricep Extension', sets: 3, reps: 12, restSeconds: 60, targetMuscles: ['Triceps'] },
    ],
  },
];

export const XP_PER_LEVEL = 500;
export const RANKS = ['Rookie', 'Amateur', 'Dedicated', 'Advanced', 'Elite', 'Champion', 'Legendary'];

export function getLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getRank(level: number): string {
  const idx = Math.min(Math.floor((level - 1) / 3), RANKS.length - 1);
  return RANKS[idx];
}

export function getXpToNextLevel(xp: number): number {
  const currentLevel = getLevel(xp);
  return currentLevel * XP_PER_LEVEL - xp;
}

export function getXpProgress(xp: number): number {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL;
}

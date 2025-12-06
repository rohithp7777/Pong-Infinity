
import { Theme, Difficulty } from './types';

export const THEMES: Theme[] = [
  {
    id: 'space',
    name: 'Outer Space',
    // Vibrant Nebula
    bgImage: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2072&auto=format&fit=crop',
    primaryColor: '#8B5CF6', // Lighter Purple
    paddleColor: '#D8B4FE', // Lilac for ship body
    ballColor: '#FDE047', // Yellow core
    brickColors: ['#6366F1', '#EC4899', '#8B5CF6'], // Indigo, Pink, Purple
    textColor: '#FFFFFF',
    icon: 'rocket_launch',
    // Generic drone/hum for space ambiance
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/M1_Nebula_Sound.ogg' 
  },
  {
    id: 'futuristic',
    name: 'Futuristic',
    // Neon Cyberpunk
    bgImage: 'https://images.unsplash.com/photo-1515630278258-407f66498911?q=80&w=2070&auto=format&fit=crop',
    primaryColor: '#25d1f4',
    paddleColor: '#00D1FF',
    ballColor: '#00D1FF',
    brickColors: ['#FF00FF', '#00FFFF', '#FFFF00'],
    textColor: '#E0F2FE',
    icon: 'neurology',
    // Electronic/Computer hum
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Computer_hum.ogg'
  },
  {
    id: 'desert',
    name: 'Desert',
    // Sand Dunes
    bgImage: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=2070&auto=format&fit=crop',
    primaryColor: '#f4c025',
    paddleColor: '#8B4513',
    ballColor: '#4A2E2A',
    brickColors: ['#E0A96D', '#D2691E', '#F4D03F'],
    textColor: '#FEF3C7',
    icon: 'wb_sunny',
    // Wind blowing
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Wind_blowing.ogg'
  },
  {
    id: 'winter',
    name: 'Winter',
    // Snowy Forest
    bgImage: 'https://images.unsplash.com/photo-1517299321609-52687d1bc555?q=80&w=2070&auto=format&fit=crop',
    primaryColor: '#0d7ff2',
    paddleColor: '#CFFAFE',
    ballColor: '#FFFFFF',
    brickColors: ['#A5F3FC', '#E0F2FE', '#7DD3FC'],
    textColor: '#FFFFFF',
    icon: 'ac_unit',
    // Cold wind
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Wind_blowing_in_the_trees.ogg'
  },
  {
    id: 'beach',
    name: 'Beach',
    // Tropical Beach
    bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop',
    primaryColor: '#0da6f2',
    paddleColor: '#F59E0B',
    ballColor: '#F472B6',
    brickColors: ['#FCA5A5', '#FDE047', '#6EE7B7'],
    textColor: '#0C4A6E',
    icon: 'surfing',
    // Ocean waves
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Ocean_Sounds.ogg'
  },
  {
    id: 'mountain',
    name: 'Mountain',
    // Majestic Peaks
    bgImage: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=2070&auto=format&fit=crop',
    primaryColor: '#10B981',
    paddleColor: '#374151',
    ballColor: '#D1D5DB',
    brickColors: ['#4B5563', '#6B7280', '#9CA3AF'],
    textColor: '#ECFDF5',
    icon: 'landscape',
    // Nature/Wind
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Strong_wind_blowing_in_the_trees.ogg'
  }
];

export const GAME_WIDTH = 450; 
export const GAME_HEIGHT = 800; 
export const PADDLE_WIDTH_BASE = 100;
export const PADDLE_HEIGHT = 16;
export const PADDLE_OFFSET_BOTTOM = 80; 
export const BALL_RADIUS = 8;
export const BRICK_ROW_COUNT = 7;
export const BRICK_COL_COUNT = 5;
export const BRICK_PADDING = 8;
export const BRICK_OFFSET_TOP = 140; 
export const BRICK_OFFSET_LEFT = 15;
export const BRICK_WIDTH = (GAME_WIDTH - (BRICK_OFFSET_LEFT * 2) - (BRICK_PADDING * (BRICK_COL_COUNT - 1))) / BRICK_COL_COUNT;
export const BRICK_HEIGHT = 24;

export const INITIAL_LIVES = 5;
export const MAX_LIVES = 10;
export const DROP_SPEED = 3.5;

export const DIFFICULTY_SETTINGS = {
  [Difficulty.EASY]: {
    ballSpeed: 2.65, 
    paddleWidth: 120,
    timeLimit: 180
  },
  [Difficulty.MEDIUM]: {
    ballSpeed: 4.6, 
    paddleWidth: 100,
    timeLimit: 180
  },
  [Difficulty.HARD]: {
    ballSpeed: 7.3, 
    paddleWidth: 80,
    timeLimit: 180
  }
};

export const HIGH_SCORES_KEY = 'pong_infinity_highscores';

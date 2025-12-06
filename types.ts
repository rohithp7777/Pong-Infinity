
export type ThemeId = 'space' | 'futuristic' | 'desert' | 'winter' | 'beach' | 'mountain';

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Theme {
  id: ThemeId;
  name: string;
  bgImage: string;
  primaryColor: string;
  paddleColor: string;
  ballColor: string;
  brickColors: string[];
  textColor: string;
  icon: string;
  audioUrl: string; // Added for ambient sound
}

export interface HighScore {
  name: string;
  time: number; // Remaining seconds
  score: number;
  date: string;
  difficulty: string;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  HIGH_SCORES = 'HIGH_SCORES',
  HELP = 'HELP',
  SETTINGS = 'SETTINGS'
}

export interface GameSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

export enum DropType {
  MULTIPLIER = 'MULTIPLIER', // Multi-ball
  LIFE_UP = 'LIFE_UP',
  LIFE_DOWN = 'LIFE_DOWN',
  TIME_UP = 'TIME_UP',
  TIME_DOWN = 'TIME_DOWN',
  BONUS = 'BONUS',
}

export interface Drop {
  id: number;
  x: number;
  y: number;
  type: DropType;
  width: number;
  height: number;
  active: boolean;
}

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  active: boolean;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  type: 'normal' | 'unbreakable' | 'special';
  hitsLeft: number; 
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  life: number;
}

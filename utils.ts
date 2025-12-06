
import { HighScore, GameSettings } from "./types";

export function formatTime(seconds: number): string {
  if (seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function saveHighScore(key: string, newScore: HighScore) {
  const existing = getHighScores(key);
  const updated = [...existing, newScore];
  
  // Sort by Score Descending, then by Time Remaining Descending
  updated.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score; // Higher score is better
    }
    return b.time - a.time; // More time remaining is better (tie-breaker)
  });

  const top5 = updated.slice(0, 5);
  localStorage.setItem(key, JSON.stringify(top5));
}

export function getHighScores(key: string): HighScore[] {
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// --- Settings ---

const SETTINGS_KEY = 'pong_infinity_settings';
const DEFAULT_SETTINGS: GameSettings = { musicEnabled: true, sfxEnabled: true };

export function getSettings(): GameSettings {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// --- Audio System (Web Audio API) ---
let audioCtx: AudioContext | null = null;

export const playGameSound = (type: 'paddle' | 'brick' | 'wall' | 'powerup' | 'penalty' | 'win' | 'lose') => {
    // Only initialize on first interaction to respect browser policy
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;

    switch (type) {
        case 'paddle':
            // Sharp ping
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
            
        case 'brick':
            // Glassy break
            osc.type = 'square';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
            break;
            
        case 'wall':
            // Dull thud
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.05);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
            break;
            
        case 'powerup':
            // Ascending major arpeggio
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
            notes.forEach((freq, i) => {
                const o = audioCtx!.createOscillator();
                const g = audioCtx!.createGain();
                o.connect(g);
                g.connect(audioCtx!.destination);
                o.type = 'sine';
                o.frequency.setValueAtTime(freq, now + i * 0.08);
                g.gain.setValueAtTime(0.1, now + i * 0.08);
                g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.1);
                o.start(now + i * 0.08);
                o.stop(now + i * 0.08 + 0.1);
            });
            break;

        case 'penalty':
             // Discordant buzz
             osc.type = 'sawtooth';
             osc.frequency.setValueAtTime(150, now);
             osc.frequency.linearRampToValueAtTime(50, now + 0.3);
             gain.gain.setValueAtTime(0.2, now);
             gain.gain.linearRampToValueAtTime(0, now + 0.3);
             osc.start(now);
             osc.stop(now + 0.3);
             break;

        case 'win':
             // Victory fanfare
             const winNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; 
             winNotes.forEach((freq, i) => {
                const o = audioCtx!.createOscillator();
                const g = audioCtx!.createGain();
                o.connect(g);
                g.connect(audioCtx!.destination);
                o.type = 'square';
                o.frequency.setValueAtTime(freq, now + i * 0.1);
                g.gain.setValueAtTime(0.1, now + i * 0.1);
                g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
                o.start(now + i * 0.1);
                o.stop(now + i * 0.1 + 0.4);
            });
            break;
            
        case 'lose':
            // Sad slide down
             osc.type = 'triangle';
             osc.frequency.setValueAtTime(300, now);
             osc.frequency.linearRampToValueAtTime(50, now + 1.0);
             gain.gain.setValueAtTime(0.3, now);
             gain.gain.linearRampToValueAtTime(0, now + 1.0);
             osc.start(now);
             osc.stop(now + 1.0);
             break;
    }
}

// --- Collision Logic ---

export function rectIntersect(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

// Improved Collision Logic with Reflection Vector
export function resolveCollision(
  cx: number, cy: number, radius: number,
  rx: number, ry: number, rw: number, rh: number
) {
  // Find closest point on rect to circle center
  const testX = Math.max(rx, Math.min(cx, rx + rw));
  const testY = Math.max(ry, Math.min(cy, ry + rh));

  const distX = cx - testX;
  const distY = cy - testY;
  const distanceSq = (distX * distX) + (distY * distY);

  if (distanceSq <= radius * radius) {
    // Collision detected
    // Determine reflect axis based on overlap
    
    const overlapX = (radius) - Math.abs(cx - testX);
    const overlapY = (radius) - Math.abs(cy - testY);

    // If we are strictly inside (testX == cx), fallback to centers
    if (distX === 0 && distY === 0) {
        // deeply embedded, push up
        return { hit: true, axis: 'y', pen: radius };
    }

    // Determine primary axis of collision
    // If the center is between the left and right edges, it's likely a Top/Bottom hit
    if (cx >= rx && cx <= rx + rw) {
        return { hit: true, axis: 'y', pen: overlapY };
    } 
    // If the center is between top and bottom edges, it's a Side hit
    else if (cy >= ry && cy <= ry + rh) {
        return { hit: true, axis: 'x', pen: overlapX };
    }
    // Corner hit: resolve based on smallest overlap to push out
    else {
        if (Math.abs(distX) > Math.abs(distY)) {
             return { hit: true, axis: 'x', pen: overlapX };
        } else {
             return { hit: true, axis: 'y', pen: overlapY };
        }
    }
  }

  return { hit: false, axis: 'none', pen: 0 };
}

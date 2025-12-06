
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
    GAME_WIDTH, GAME_HEIGHT, PADDLE_HEIGHT, PADDLE_OFFSET_BOTTOM, BALL_RADIUS, 
    BRICK_ROW_COUNT, BRICK_COL_COUNT, BRICK_PADDING, BRICK_OFFSET_TOP, BRICK_OFFSET_LEFT, BRICK_WIDTH, BRICK_HEIGHT,
    INITIAL_LIVES, MAX_LIVES, DROP_SPEED, HIGH_SCORES_KEY, DIFFICULTY_SETTINGS
} from '../constants';
import { Theme, GameState, Brick, Ball, Drop, DropType, Particle, Difficulty, GameSettings } from '../types';
import { resolveCollision, rectIntersect, saveHighScore, formatTime, playGameSound } from '../utils';

interface GameEngineProps {
    theme: Theme;
    difficulty: Difficulty;
    settings: GameSettings;
    onGameOver: () => void;
    onBackToMenu: () => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ theme, difficulty, settings, onGameOver, onBackToMenu }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    
    // Audio
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Config based on Difficulty
    const config = DIFFICULTY_SETTINGS[difficulty];

    // Refs
    const gameStateRef = useRef<GameState>(GameState.PLAYING);
    const scoreRef = useRef(0);
    const timeRef = useRef(config.timeLimit); 
    const livesRef = useRef(INITIAL_LIVES);
    
    const paddleY = GAME_HEIGHT - PADDLE_HEIGHT - PADDLE_OFFSET_BOTTOM;
    const paddleRef = useRef({ x: (GAME_WIDTH - config.paddleWidth) / 2, width: config.paddleWidth });
    
    const ballsRef = useRef<Ball[]>([]);
    const bricksRef = useRef<Brick[]>([]);
    const dropsRef = useRef<Drop[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const lastTimeRef = useRef<number>(0);
    const rotationRef = useRef(0);

    // State
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [time, setTime] = useState(config.timeLimit);
    const [isPaused, setIsPaused] = useState(false);
    const [resultState, setResultState] = useState<'NONE' | 'GAME_OVER' | 'VICTORY'>('NONE');
    const [playerName, setPlayerName] = useState("");
    const [scoreSaved, setScoreSaved] = useState(false);

    // Initialize Audio
    useEffect(() => {
        if (theme.audioUrl) {
            audioRef.current = new Audio(theme.audioUrl);
            audioRef.current.loop = true;
            audioRef.current.volume = 0.3; // 30% volume for ambient
            
            if (settings.musicEnabled) {
                audioRef.current.play().catch(e => console.log("Audio play blocked until interaction", e));
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [theme.audioUrl]); // Only re-run if theme changes

    // Watch Settings for Music
    useEffect(() => {
        if (!audioRef.current) return;
        
        if (settings.musicEnabled && !isPaused && resultState === 'NONE') {
            audioRef.current.play().catch(() => {});
        } else {
            audioRef.current.pause();
        }
    }, [settings.musicEnabled, isPaused, resultState]);

    const playSFX = useCallback((type: 'paddle' | 'brick' | 'wall' | 'powerup' | 'penalty' | 'win' | 'lose') => {
        if (settings.sfxEnabled) {
            playGameSound(type);
        }
    }, [settings.sfxEnabled]);

    const initGame = useCallback(() => {
        scoreRef.current = 0;
        timeRef.current = config.timeLimit;
        livesRef.current = INITIAL_LIVES;
        paddleRef.current = { x: (GAME_WIDTH - config.paddleWidth) / 2, width: config.paddleWidth };
        
        ballsRef.current = [{ 
            x: GAME_WIDTH / 2, 
            y: GAME_HEIGHT - 200, 
            dx: config.ballSpeed * (Math.random() > 0.5 ? 1 : -1), 
            dy: -config.ballSpeed, 
            radius: BALL_RADIUS, 
            active: true 
        }];
        
        dropsRef.current = [];
        particlesRef.current = [];
        
        // Generate Level
        const newBricks: Brick[] = [];
        const patternType = Math.floor(Math.random() * 3); 

        for (let c = 0; c < BRICK_COL_COUNT; c++) {
            for (let r = 0; r < BRICK_ROW_COUNT; r++) {
                let isActive = true;
                if (patternType === 1) { // Checkers
                     if ((c + r) % 2 !== 0) isActive = false;
                } else if (patternType === 2) { // Diamond/Pyramid
                     if (r < 2 && (c === 0 || c === BRICK_COL_COUNT - 1)) isActive = false;
                }

                if (isActive) {
                    const isUnbreakable = Math.random() < 0.05; // Reduced chance
                    const isSpecial = !isUnbreakable && Math.random() < 0.2;
                    
                    newBricks.push({
                        x: (c * (BRICK_WIDTH + BRICK_PADDING)) + BRICK_OFFSET_LEFT,
                        y: (r * (BRICK_HEIGHT + BRICK_PADDING)) + BRICK_OFFSET_TOP,
                        width: BRICK_WIDTH,
                        height: BRICK_HEIGHT,
                        active: true,
                        type: isUnbreakable ? 'unbreakable' : isSpecial ? 'special' : 'normal',
                        hitsLeft: isUnbreakable ? 999 : 1
                    });
                }
            }
        }
        bricksRef.current = newBricks;
        
        gameStateRef.current = GameState.PLAYING;
        setScore(0);
        setLives(INITIAL_LIVES);
        setTime(config.timeLimit);
        setResultState('NONE');
        setIsPaused(false);
        setScoreSaved(false);
        setPlayerName("");
    }, [config]);

    useEffect(() => {
        initGame();
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                 paddleRef.current.x = Math.max(0, paddleRef.current.x - 30);
            }
            if (e.key === 'ArrowRight') {
                 paddleRef.current.x = Math.min(GAME_WIDTH - paddleRef.current.width, paddleRef.current.x + 30);
            }
            if (e.key === 'Escape') togglePause();
        };

        window.addEventListener('keydown', handleKeyDown);
        requestRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [initGame]);

    // Timer Interval (Countdown)
    useEffect(() => {
        const interval = setInterval(() => {
            if (gameStateRef.current === GameState.PLAYING) {
                timeRef.current -= 1;
                setTime(timeRef.current);
                if (timeRef.current <= 0) {
                    handleGameOver(false);
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleInput = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (gameStateRef.current !== GameState.PLAYING) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        // Since we removed object-cover, the canvas might stretch, but the coordinate mapping below 
        // works as long as the canvas element fills the space and we scale by internal vs external width.
        const scaleX = GAME_WIDTH / rect.width;
        const x = (e.clientX - rect.left) * scaleX;
        let newX = x - (paddleRef.current.width / 2);
        newX = Math.max(0, Math.min(GAME_WIDTH - paddleRef.current.width, newX));
        
        // Lerp for smooth paddle movement
        const smoothing = 0.2; 
        paddleRef.current.x = paddleRef.current.x + (newX - paddleRef.current.x) * smoothing;
    };

    const togglePause = () => {
        if (gameStateRef.current === GameState.PLAYING) {
            gameStateRef.current = GameState.PAUSED;
            setIsPaused(true);
        } else if (gameStateRef.current === GameState.PAUSED) {
            gameStateRef.current = GameState.PLAYING;
            setIsPaused(false);
        }
    };

    const spawnDrop = (x: number, y: number) => {
        const types = [DropType.MULTIPLIER, DropType.LIFE_UP, DropType.LIFE_DOWN, DropType.TIME_UP, DropType.TIME_DOWN, DropType.BONUS];
        const type = types[Math.floor(Math.random() * types.length)];
        dropsRef.current.push({
            id: Date.now() + Math.random(),
            x, y, type, width: 28, height: 28, active: true
        });
    };

    const createParticles = (x: number, y: number, color: string) => {
        for(let i=0; i<8; i++) {
            particlesRef.current.push({
                id: Math.random(),
                x, y,
                dx: (Math.random() - 0.5) * 5,
                dy: (Math.random() - 0.5) * 5,
                life: 1.0,
                color
            });
        }
    };

    const gameLoop = (timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        
        // Calculate delta time in seconds
        const dt = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;

        if (gameStateRef.current === GameState.PLAYING) {
            update(dt);
            rotationRef.current += 0.05; 
        }
        draw();
        requestRef.current = requestAnimationFrame(gameLoop);
    };

    const update = (dt: number) => {
        // Cap dt to prevent huge jumps if tab is inactive
        const safeDt = Math.min(dt, 0.1);
        // Multiplier to normalize speed (since original logic was per-frame)
        // Assuming ~60fps, 1 frame is ~0.016s. speed 5 means 5 pixels per frame.
        // So pixels per second = 5 * 60 = 300.
        // We'll stick to per-frame logic scaled by time ratio (safeDt / (1/60))
        const timeScale = safeDt * 60;

        // --- Ball Logic ---
        ballsRef.current.forEach(ball => {
            if (!ball.active) return;

            // Trail Effect - Subtle and Frequent
            // Create a small particle every frame for smoothness
            particlesRef.current.push({
                id: Math.random(),
                x: ball.x,
                y: ball.y,
                dx: (Math.random() - 0.5) * 0.2, // Low velocity spread
                dy: (Math.random() - 0.5) * 0.2,
                life: 0.3, // Short life for "trail" feel
                color: theme.id === 'space' ? '#FDE047' : theme.ballColor // Use theme color
            });

            // Move (Sub-stepping for high speed collisions)
            const steps = Math.ceil(Math.max(Math.abs(ball.dx), Math.abs(ball.dy)) * timeScale / BALL_RADIUS);
            const stepDx = (ball.dx * timeScale) / steps;
            const stepDy = (ball.dy * timeScale) / steps;

            for (let i = 0; i < steps; i++) {
                ball.x += stepDx;
                ball.y += stepDy;

                // Wall Collisions
                if (ball.x + ball.radius > GAME_WIDTH) {
                    ball.x = GAME_WIDTH - ball.radius;
                    ball.dx = -Math.abs(ball.dx);
                    playSFX('wall');
                } else if (ball.x - ball.radius < 0) {
                    ball.x = ball.radius;
                    ball.dx = Math.abs(ball.dx);
                    playSFX('wall');
                }

                if (ball.y - ball.radius < 0) {
                    ball.y = ball.radius;
                    ball.dy = Math.abs(ball.dy);
                    playSFX('wall');
                }
                
                // Bottom (Death)
                if (ball.y - ball.radius > GAME_HEIGHT) {
                    ball.active = false;
                    break;
                }

                // Paddle Collision
                const paddleHit = resolveCollision(ball.x, ball.y, ball.radius, paddleRef.current.x, paddleY, paddleRef.current.width, PADDLE_HEIGHT);
                if (paddleHit.hit) {
                    playSFX('paddle');
                    ball.y = paddleY - ball.radius; 
                    let hitPoint = ball.x - (paddleRef.current.x + paddleRef.current.width / 2);
                    hitPoint = hitPoint / (paddleRef.current.width / 2);
                    
                    const angle = hitPoint * (Math.PI / 3); 
                    const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                    const newSpeed = Math.min(currentSpeed * 1.05, config.ballSpeed * 2.5);

                    ball.dx = newSpeed * Math.sin(angle);
                    ball.dy = -newSpeed * Math.cos(angle);
                    break; // Handled collision for this step
                }

                // Brick Collision
                let hitBrick = false;
                for (const brick of bricksRef.current) {
                    if (!brick.active) continue;
                    
                    const brickHit = resolveCollision(ball.x, ball.y, ball.radius, brick.x, brick.y, brick.width, brick.height);
                    if (brickHit.hit) {
                        if (brickHit.axis === 'x') {
                            ball.dx = -ball.dx;
                            ball.x += (ball.dx > 0 ? 1 : -1) * brickHit.pen;
                        } else {
                            ball.dy = -ball.dy;
                            ball.y += (ball.dy > 0 ? 1 : -1) * brickHit.pen;
                        }

                        if (brick.type !== 'unbreakable') {
                            brick.hitsLeft--;
                            if (brick.hitsLeft <= 0) {
                                brick.active = false;
                                playSFX('brick');
                                scoreRef.current += brick.type === 'special' ? 250 : 100;
                                setScore(scoreRef.current);
                                createParticles(brick.x + brick.width/2, brick.y + brick.height/2, theme.primaryColor);
                                
                                if (brick.type === 'special' || Math.random() < 0.15) {
                                    spawnDrop(brick.x + brick.width/2, brick.y + brick.height/2);
                                }
                            }
                        } else {
                             playSFX('wall'); // Metal sound for unbreakable
                             createParticles(brick.x + brick.width/2, brick.y + brick.height/2, '#FFFFFF');
                        }
                        hitBrick = true;
                        break;
                    }
                }
                if(hitBrick) break;
            }
        });

        // Life Management
        if (!ballsRef.current.some(b => b.active)) {
            if (livesRef.current > 0) {
                livesRef.current--;
                setLives(livesRef.current);
                if (livesRef.current > 0) {
                     ballsRef.current.push({ 
                        x: GAME_WIDTH / 2, 
                        y: GAME_HEIGHT / 2, 
                        dx: config.ballSpeed * (Math.random() > 0.5 ? 1 : -1), 
                        dy: config.ballSpeed, 
                        radius: BALL_RADIUS, 
                        active: true 
                    });
                } else {
                    handleGameOver(false);
                }
            } else {
                handleGameOver(false);
            }
        }
        
        ballsRef.current = ballsRef.current.filter(b => b.active);

        // --- Drops ---
        dropsRef.current.forEach(drop => {
            if (!drop.active) return;
            drop.y += DROP_SPEED * timeScale;
            if (rectIntersect(drop.x - drop.width/2, drop.y - drop.height/2, drop.width, drop.height, paddleRef.current.x, paddleY, paddleRef.current.width, PADDLE_HEIGHT)) {
                drop.active = false;
                applyDropEffect(drop.type);
                createParticles(drop.x, drop.y, '#FFD700'); 
            }
            if (drop.y > GAME_HEIGHT) drop.active = false;
        });

        // --- Particles ---
        particlesRef.current.forEach(p => {
            p.x += p.dx * timeScale;
            p.y += p.dy * timeScale;
            p.life -= 0.05 * timeScale; 
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        // Win Condition
        const remainingBreakables = bricksRef.current.filter(b => b.active && b.type !== 'unbreakable').length;
        if (remainingBreakables === 0) {
             handleGameOver(true);
        }
    };

    const applyDropEffect = (type: DropType) => {
        switch (type) {
            case DropType.MULTIPLIER:
                playSFX('powerup');
                if (ballsRef.current.length > 0) {
                    const b = ballsRef.current[0];
                    ballsRef.current.push({ ...b, dx: -b.dx, dy: b.dy }); 
                }
                scoreRef.current += 500;
                setScore(scoreRef.current);
                break;
            case DropType.LIFE_UP:
                playSFX('powerup');
                if (livesRef.current < MAX_LIVES) {
                    livesRef.current++;
                    setLives(livesRef.current);
                }
                break;
            case DropType.LIFE_DOWN:
                playSFX('penalty');
                if (livesRef.current > 0) {
                    livesRef.current--;
                    setLives(livesRef.current);
                    if (livesRef.current <= 0) handleGameOver(false);
                }
                break;
            case DropType.TIME_UP:
                playSFX('powerup');
                timeRef.current += 20;
                setTime(timeRef.current);
                scoreRef.current += 100;
                setScore(scoreRef.current);
                break;
            case DropType.TIME_DOWN:
                 playSFX('penalty');
                 timeRef.current = Math.max(0, timeRef.current - 20);
                 setTime(timeRef.current);
                 if (timeRef.current <= 0) handleGameOver(false);
                 break;
            case DropType.BONUS:
                 playSFX('powerup');
                 scoreRef.current += 500;
                 setScore(scoreRef.current);
                 break;
        }
    };

    const handleGameOver = (win: boolean) => {
        if (gameStateRef.current !== GameState.PLAYING) return;
        gameStateRef.current = win ? GameState.VICTORY : GameState.GAME_OVER;
        playSFX(win ? 'win' : 'lose');
        setResultState(win ? 'VICTORY' : 'GAME_OVER');
        onGameOver();
    };

    const handleSaveScore = () => {
        if (!playerName.trim() || scoreSaved) return;
        // Use difficulty-specific key
        saveHighScore(`${HIGH_SCORES_KEY}_${difficulty}`, {
            name: playerName,
            score: scoreRef.current + (resultState === 'VICTORY' ? timeRef.current * 10 : 0),
            time: timeRef.current,
            date: new Date().toISOString(),
            difficulty
        });
        setScoreSaved(true);
    };

    const handleRestart = () => {
        initGame();
    };

    // --- Drawing Helpers ---

    const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    };

    const drawThemeBrick = (ctx: CanvasRenderingContext2D, brick: Brick) => {
        // Universal Unbreakable look
        if (brick.type === 'unbreakable') {
            ctx.fillStyle = '#1e293b'; 
            drawRoundedRect(ctx, brick.x, brick.y, brick.width, brick.height, 4);
            ctx.fill();
            
            // Rivets
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(brick.x + 4, brick.y + 4, 2, 0, Math.PI*2);
            ctx.arc(brick.x + brick.width - 4, brick.y + 4, 2, 0, Math.PI*2);
            ctx.arc(brick.x + 4, brick.y + brick.height - 4, 2, 0, Math.PI*2);
            ctx.arc(brick.x + brick.width - 4, brick.y + brick.height - 4, 2, 0, Math.PI*2);
            ctx.fill();
            
            // X-cross
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(brick.x + 2, brick.y + 2);
            ctx.lineTo(brick.x + brick.width - 2, brick.y + brick.height - 2);
            ctx.moveTo(brick.x + brick.width - 2, brick.y + 2);
            ctx.lineTo(brick.x + 2, brick.y + brick.height - 2);
            ctx.stroke();
            return;
        }

        const color = theme.brickColors[Math.floor((brick.x / GAME_WIDTH) * theme.brickColors.length) % theme.brickColors.length];

        switch (theme.id) {
            case 'space':
                // Hull Plating / Sci-fi Panel
                ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; // Darker, semi-transparent base
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                
                drawRoundedRect(ctx, brick.x, brick.y, brick.width, brick.height, 4);
                ctx.fill();
                ctx.stroke();
                
                // Energy Core Glow
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.6;
                drawRoundedRect(ctx, brick.x + 6, brick.y + 6, brick.width - 12, brick.height - 12, 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 0;
                break;

            case 'futuristic':
                // Neon Grid
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                ctx.strokeRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height - 4);
                
                // Grid line
                ctx.beginPath();
                ctx.moveTo(brick.x + 2, brick.y + brick.height/2);
                ctx.lineTo(brick.x + brick.width - 2, brick.y + brick.height/2);
                ctx.stroke();
                ctx.shadowBlur = 0;
                break;

            case 'desert':
                // Sandstone with cracks
                ctx.fillStyle = color;
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                // Crack
                ctx.strokeStyle = 'rgba(70, 40, 0, 0.3)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(brick.x + 5, brick.y + 5);
                ctx.lineTo(brick.x + 10, brick.y + 12);
                ctx.lineTo(brick.x + 5, brick.y + 18);
                ctx.stroke();
                // Highlight top
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(brick.x, brick.y, brick.width, 2);
                break;

            case 'winter':
                // Ice Block
                ctx.fillStyle = color; // Light blue base
                drawRoundedRect(ctx, brick.x, brick.y, brick.width, brick.height, 2);
                ctx.fill();
                // Shine (diagonal)
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.beginPath();
                ctx.moveTo(brick.x, brick.y + brick.height);
                ctx.lineTo(brick.x + brick.width, brick.y);
                ctx.lineTo(brick.x, brick.y);
                ctx.fill();
                break;

            case 'beach':
                 // Inflatable Floats (Plastic Look)
                 ctx.fillStyle = color;
                 drawRoundedRect(ctx, brick.x, brick.y, brick.width, brick.height, 6);
                 ctx.fill();
                 
                 // Plastic Shine Highlight
                 ctx.fillStyle = 'rgba(255,255,255,0.4)';
                 ctx.beginPath();
                 ctx.ellipse(brick.x + 10, brick.y + 6, 6, 3, 0, 0, Math.PI*2);
                 ctx.fill();
                 
                 // Seam lines (Air mattress style)
                 ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                 ctx.lineWidth = 1;
                 ctx.beginPath();
                 ctx.moveTo(brick.x + brick.width/3, brick.y);
                 ctx.lineTo(brick.x + brick.width/3, brick.y + brick.height);
                 ctx.moveTo(brick.x + 2*brick.width/3, brick.y);
                 ctx.lineTo(brick.x + 2*brick.width/3, brick.y + brick.height);
                 ctx.stroke();
                 break;
                 
            case 'mountain':
                // Granite Stone
                ctx.fillStyle = color;
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                // Random dots
                ctx.beginPath();
                ctx.arc(brick.x + 5, brick.y + 5, 2, 0, Math.PI*2);
                ctx.arc(brick.x + brick.width - 8, brick.y + 8, 3, 0, Math.PI*2);
                ctx.fill();
                // Bevel
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(brick.x, brick.y + brick.height - 2, brick.width, 2);
                ctx.fillRect(brick.x + brick.width - 2, brick.y, 2, brick.height);
                break;

            default:
                ctx.fillStyle = color;
                drawRoundedRect(ctx, brick.x, brick.y, brick.width, brick.height, 4);
                ctx.fill();
        }
    };

    const drawThemePaddle = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
         switch (theme.id) {
            case 'space':
                // Spaceship
                ctx.fillStyle = '#CBD5E1'; // Silver body
                ctx.beginPath();
                // Main body wings
                ctx.moveTo(x, y + h);
                ctx.lineTo(x + 10, y);
                ctx.lineTo(x + w - 10, y);
                ctx.lineTo(x + w, y + h);
                ctx.closePath();
                ctx.fill();
                
                // Engine Glow
                ctx.fillStyle = theme.primaryColor;
                ctx.shadowColor = theme.primaryColor;
                ctx.shadowBlur = 15;
                ctx.fillRect(x + w/2 - 15, y + h, 10, 5);
                ctx.fillRect(x + w/2 + 5, y + h, 10, 5);
                ctx.shadowBlur = 0;
                
                // Cockpit
                ctx.fillStyle = '#0EA5E9';
                ctx.beginPath();
                ctx.ellipse(x + w/2, y + h/2, 10, 4, 0, 0, Math.PI*2);
                ctx.fill();
                break;
            
            case 'futuristic':
                // Capsule
                ctx.fillStyle = theme.paddleColor;
                ctx.shadowColor = theme.paddleColor;
                ctx.shadowBlur = 10;
                drawRoundedRect(ctx, x, y, w, h, h/2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#fff';
                ctx.fillRect(x + 10, y + 4, w - 20, 2);
                break;
                
            case 'desert':
                // Wood Plank
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x, y, w, h);
                ctx.fillStyle = '#5D4037'; // Wood grain
                ctx.fillRect(x + 5, y + 2, w - 10, 2);
                ctx.fillRect(x + 20, y + 8, w - 40, 2);
                break;
                
            case 'winter':
                // Ice Bar
                ctx.fillStyle = '#A5F3FC';
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 8;
                ctx.fillRect(x, y, w, h);
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillRect(x, y, w, 4);
                break;

            default:
                ctx.fillStyle = theme.paddleColor;
                ctx.shadowColor = theme.paddleColor;
                ctx.shadowBlur = 10;
                drawRoundedRect(ctx, x, y, w, h, 8);
                ctx.fill();
                ctx.shadowBlur = 0;
         }
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Bricks
        bricksRef.current.forEach(brick => {
            if (!brick.active) return;
            ctx.save();
            drawThemeBrick(ctx, brick);
            ctx.restore();
        });

        // Paddle
        ctx.save();
        drawThemePaddle(ctx, paddleRef.current.x, paddleY, paddleRef.current.width, PADDLE_HEIGHT);
        ctx.restore();

        // Balls
        ballsRef.current.forEach(ball => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            
            if (theme.id === 'space') {
                 // Comet effect
                 ctx.fillStyle = '#FDE047'; // Core
                 ctx.shadowColor = '#F59E0B';
                 ctx.shadowBlur = 10;
                 ctx.fill();
                 ctx.shadowBlur = 0;
            } else {
                 ctx.fillStyle = theme.ballColor;
                 ctx.fill();
            }
        });

        // Drops
        ctx.font = '24px "Material Symbols Outlined"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        dropsRef.current.forEach(drop => {
            if (!drop.active) return;
            let icon = 'help';
            let bg = '#fff';
            let color = '#000';

            if (theme.id === 'space') {
                 // Space Board Game Theme
                 switch(drop.type) {
                    case DropType.MULTIPLIER: icon = 'rocket_launch'; bg = '#ef4444'; color = '#fff'; break; // Red Rocket
                    case DropType.LIFE_UP: icon = 'public'; bg = '#10b981'; color = '#fff'; break; // Earth
                    case DropType.LIFE_DOWN: icon = 'cookie'; bg = '#78350f'; color = '#fff'; break; // Meteor/Asteroid
                    case DropType.TIME_UP: icon = 'toys'; bg = '#06b6d4'; color = '#fff'; break; // UFO (Cyan)
                    case DropType.TIME_DOWN: icon = 'cyclone'; bg = '#4c1d95'; color = '#fff'; break; // Black Hole
                    case DropType.BONUS: icon = 'savings'; bg = '#fbbf24'; color = '#000'; break; // Gold
                }
            } else if (theme.id === 'winter') {
                switch(drop.type) {
                    case DropType.MULTIPLIER: icon = 'ac_unit'; bg = '#A5F3FC'; color = '#000'; break;
                    case DropType.LIFE_UP: icon = 'favorite'; bg = '#EC4899'; color = '#fff'; break; 
                    case DropType.LIFE_DOWN: icon = 'local_fire_department'; bg = '#EF4444'; color = '#fff'; break; 
                    case DropType.TIME_UP: icon = 'schedule'; bg = '#3B82F6'; color = '#fff'; break; 
                    case DropType.TIME_DOWN: icon = 'warning'; bg = '#F97316'; color = '#fff'; break; 
                    case DropType.BONUS: icon = 'savings'; bg = '#fbbf24'; color = '#000'; break;
                }
            } else if (theme.id === 'desert') {
                 switch(drop.type) {
                    case DropType.MULTIPLIER: icon = 'close'; bg = '#FDE047'; break; 
                    case DropType.LIFE_UP: icon = 'water_drop'; bg = '#3B82F6'; color = '#fff'; break; 
                    case DropType.LIFE_DOWN: icon = 'skull'; bg = '#000'; color = '#fff'; break; 
                    case DropType.TIME_UP: icon = 'wb_sunny'; bg = '#FDE047'; color = '#000'; break; 
                    case DropType.TIME_DOWN: icon = 'hourglass_full'; bg = '#F97316'; color = '#fff'; break; 
                    case DropType.BONUS: icon = 'savings'; bg = '#fbbf24'; color = '#000'; break;
                }
            } else {
                // Default
                switch(drop.type) {
                    case DropType.MULTIPLIER: icon = 'close'; bg = '#FDE047'; break; 
                    case DropType.LIFE_UP: icon = 'favorite'; bg = '#EC4899'; color = '#fff'; break; 
                    case DropType.LIFE_DOWN: icon = 'heart_broken'; bg = '#EF4444'; color = '#fff'; break; 
                    case DropType.TIME_UP: icon = 'hourglass_bottom'; bg = '#3B82F6'; color = '#fff'; break; 
                    case DropType.TIME_DOWN: icon = 'hourglass_full'; bg = '#F97316'; color = '#fff'; break; 
                    case DropType.BONUS: icon = 'attach_money'; bg = '#fbbf24'; color = '#000'; break;
                }
            }

            ctx.beginPath();
            ctx.arc(drop.x, drop.y, 16, 0, Math.PI * 2);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.fillStyle = color;
            ctx.fillText(icon, drop.x, drop.y);
        });

        // Particles
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });
    };

    return (
        <div className="relative w-full h-full max-w-md mx-auto overflow-hidden flex flex-col">
            {/* Background - z-0 */}
            <div 
                className="absolute inset-0 bg-cover bg-center z-0"
                style={{ backgroundImage: `url("${theme.bgImage}")` }}
            />

            {/* HUD - z-20 */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-20 pointer-events-none text-white pb-10">
                 <div className="flex flex-col gap-2">
                     <div className="flex items-baseline gap-2 drop-shadow-md">
                        <span className="text-3xl font-bold font-mono" style={{ textShadow: `0 0 10px ${theme.primaryColor}` }}>{score}</span>
                        <span className="text-xs uppercase opacity-80 font-bold">pts</span>
                     </div>
                     <div className="flex items-center gap-3">
                         {/* Timer */}
                         <div className={`flex items-center gap-1 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm border ${time < 30 ? 'border-red-500 text-red-100 animate-pulse' : 'border-white/10'}`}>
                            <span className="material-symbols-outlined text-sm">timer</span>
                            <span className="text-xl font-bold font-mono">{formatTime(time)}</span>
                         </div>
                         {/* Lives */}
                         <div className="flex text-red-500 bg-black/40 rounded-full px-2 py-1 backdrop-blur-sm border border-white/10">
                             {Array.from({length: Math.min(5, lives)}).map((_, i) => (
                                 <span key={i} className="material-symbols-outlined text-sm">favorite</span>
                             ))}
                             {lives > 5 && <span className="text-sm font-bold ml-1 text-white">+{lives-5}</span>}
                         </div>
                     </div>
                 </div>
                 
                 <button 
                    onClick={togglePause}
                    className="pointer-events-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 active:scale-95 shadow-lg hover:bg-white/20 transition"
                 >
                    <span className="material-symbols-outlined text-white text-3xl">{isPaused ? 'play_arrow' : 'pause'}</span>
                </button>
            </div>

            {/* Canvas - z-10 */}
            <canvas 
                ref={canvasRef}
                width={GAME_WIDTH}
                height={GAME_HEIGHT}
                className="w-full h-full touch-none cursor-crosshair relative z-10"
                onPointerDown={handleInput}
                onPointerMove={handleInput}
            />

            {/* Pause Overlay */}
            {isPaused && resultState === 'NONE' && (
                <div className="absolute inset-0 z-30 flex items-center justify-center">
                    {/* Background Layer: Image Bottom, Dark Top */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url("${theme.bgImage}")` }}
                    />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    
                    <div className="flex flex-col gap-6 items-center w-full px-8 relative z-40">
                        <h2 className="text-5xl font-bold text-white tracking-widest" style={{ color: theme.primaryColor }}>PAUSED</h2>
                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            <button onClick={togglePause} className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:scale-105 transition flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">play_arrow</span> Resume
                            </button>
                            <button onClick={onBackToMenu} className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">home</span> Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Over / Victory Overlay */}
            {resultState !== 'NONE' && (
                <div className="absolute inset-0 z-40 flex items-center justify-center p-6 animate-in zoom-in duration-300">
                     {/* Background Layer */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url("${theme.bgImage}")` }}
                    />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

                    <div className={`relative z-50 border p-8 rounded-3xl w-full max-w-sm flex flex-col gap-4 text-center shadow-2xl ${resultState === 'VICTORY' ? 'bg-gradient-to-b from-blue-900/80 to-black/90 border-blue-500/30' : 'bg-gradient-to-b from-red-900/80 to-black/90 border-red-500/30'}`}>
                        <div className="mb-2">
                            {resultState === 'VICTORY' ? (
                                <span className="material-symbols-outlined text-6xl text-yellow-400 mb-2 drop-shadow-lg">emoji_events</span>
                            ) : (
                                <span className="material-symbols-outlined text-6xl text-red-500 mb-2 drop-shadow-lg">sentiment_very_dissatisfied</span>
                            )}
                            <h2 className="text-4xl font-black text-white tracking-wide uppercase italic">{resultState === 'VICTORY' ? 'VICTORY!' : 'GAME OVER'}</h2>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
                            <div className="flex flex-col">
                                <span className="text-white/50 text-xs uppercase tracking-wider font-bold">Score</span>
                                <span className="text-3xl font-bold text-white drop-shadow-md">{score.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col border-l border-white/10">
                                <span className="text-white/50 text-xs uppercase tracking-wider font-bold">Time Left</span>
                                <span className="text-3xl font-mono text-white drop-shadow-md">{formatTime(time)}</span>
                            </div>
                        </div>

                        {resultState === 'VICTORY' && (
                             <p className="text-green-300 text-sm font-bold bg-green-500/10 py-1 rounded-full border border-green-500/20">+ {time * 10} Time Bonus Applied!</p>
                        )}

                        <div className="flex flex-col gap-2 text-left mt-2">
                            <label className="text-xs text-white/70 ml-2 font-bold uppercase">Save High Score</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                                    maxLength={8}
                                    disabled={scoreSaved}
                                    className="flex-1 bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest placeholder-white/20 focus:outline-none focus:border-white/50 transition uppercase disabled:opacity-50"
                                    placeholder="NAME"
                                    autoFocus={!scoreSaved}
                                />
                                <button 
                                    onClick={handleSaveScore}
                                    disabled={!playerName.trim() || scoreSaved}
                                    className={`px-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center ${scoreSaved ? 'bg-green-600 text-white cursor-default' : 'bg-white text-black hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                                >
                                    <span className="material-symbols-outlined">{scoreSaved ? 'check' : 'save'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button 
                                onClick={handleRestart}
                                className="bg-white/10 border border-white/20 text-white font-bold py-4 rounded-xl hover:bg-white/20 transition flex items-center justify-center gap-2 group"
                            >
                                <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">refresh</span>
                                Restart
                            </button>
                            <button 
                                onClick={onBackToMenu}
                                className="bg-white/10 border border-white/20 text-white font-bold py-4 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">home</span>
                                Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameEngine;

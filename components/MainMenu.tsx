
import React from 'react';
import { THEMES, DIFFICULTY_SETTINGS } from '../constants';
import { ThemeId, Difficulty } from '../types';

interface MainMenuProps {
  onStart: () => void;
  onHighScores: () => void;
  onHelp: () => void;
  onSettings: () => void;
  currentTheme: ThemeId;
  onSelectTheme: (id: ThemeId) => void;
  difficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ 
    onStart, onHighScores, onHelp, onSettings, currentTheme, onSelectTheme, difficulty, onSelectDifficulty 
}) => {
  const activeTheme = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto relative overflow-hidden text-white font-sans">
       {/* Background */}
       <div 
        className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-in-out"
        style={{ backgroundImage: `url("${activeTheme.bgImage}")` }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full p-6">
        <header className="flex justify-between items-center mb-6">
            <button 
                onClick={onHelp}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 hover:bg-white/20 transition"
            >
                <span className="material-symbols-outlined text-2xl">help</span>
            </button>
            <button
                onClick={onSettings} 
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 hover:bg-white/20 transition"
            >
                <span className="material-symbols-outlined text-2xl">settings</span>
            </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center space-y-6">
            <h1 className="text-5xl font-bold text-center tracking-tight drop-shadow-xl" style={{ fontFamily: 'Space Grotesk' }}>
                Pong<br/>Infinity
            </h1>

            {/* Difficulty Selector */}
            <div className="flex bg-white/10 rounded-xl p-1 backdrop-blur-sm border border-white/10">
                {(Object.values(Difficulty) as Difficulty[]).map((d) => (
                    <button
                        key={d}
                        onClick={() => onSelectDifficulty(d)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            difficulty === d 
                            ? 'bg-white text-black shadow-lg' 
                            : 'text-white/60 hover:text-white'
                        }`}
                    >
                        {d}
                    </button>
                ))}
            </div>

            <div className="w-full space-y-3">
                <button 
                    onClick={onStart}
                    className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-2 text-white"
                    style={{ backgroundColor: activeTheme.primaryColor }}
                >
                    <span className="material-symbols-outlined">play_arrow</span>
                    Start Game
                </button>

                <button 
                    onClick={onHighScores}
                    className="w-full h-14 rounded-2xl font-bold text-lg bg-white/10 border border-white/10 backdrop-blur-md shadow-lg hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">leaderboard</span>
                    High Scores
                </button>
            </div>
        </main>

        <section className="mt-6">
            <h3 className="text-sm font-bold mb-3 opacity-80 uppercase tracking-wider">Select Theme</h3>
            <div className="flex space-x-4 overflow-x-auto pb-6 -mx-6 px-6 scrollbar-hide snap-x">
                {THEMES.map((theme) => {
                    const isSelected = currentTheme === theme.id;
                    return (
                        <div 
                            key={theme.id}
                            onClick={() => onSelectTheme(theme.id)}
                            className={`flex flex-col items-center flex-shrink-0 cursor-pointer group snap-center transition-all duration-300 ${isSelected ? 'scale-105 opacity-100' : 'opacity-60 scale-95'}`}
                        >
                            <div 
                                className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-2 border-2 transition-all relative overflow-hidden shadow-lg`}
                                style={{ 
                                    borderColor: isSelected ? theme.primaryColor : 'transparent',
                                    backgroundColor: isSelected ? `${theme.primaryColor}33` : 'rgba(255,255,255,0.05)'
                                }}
                            >
                                <span className="material-symbols-outlined text-3xl relative z-10" style={{ color: isSelected ? theme.primaryColor : 'white' }}>
                                    {theme.icon}
                                </span>
                                {isSelected && (
                                    <div 
                                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: theme.primaryColor }}
                                    >
                                        <span className="material-symbols-outlined text-[10px] text-white">check</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-medium tracking-wide">{theme.name}</span>
                        </div>
                    );
                })}
            </div>
        </section>
      </div>
    </div>
  );
};

export default MainMenu;

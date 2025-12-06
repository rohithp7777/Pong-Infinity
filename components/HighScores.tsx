
import React, { useMemo } from 'react';
import { HighScore, Difficulty } from '../types';
import { formatTime, getHighScores } from '../utils';
import { HIGH_SCORES_KEY } from '../constants';

interface HighScoresProps {
  onBack: () => void;
  activeThemeColor: string;
  bgImage: string;
}

const ScoreCard: React.FC<{ score: HighScore, index: number, activeThemeColor: string }> = ({ score, index, activeThemeColor }) => {
    let trophyColor = '';
    let trophyIcon = '';

    if (index === 0) {
        trophyColor = '#FFD700'; // Gold
        trophyIcon = 'emoji_events';
    } else if (index === 1) {
        trophyColor = '#C0C0C0'; // Silver
        trophyIcon = 'emoji_events';
    } else if (index === 2) {
        trophyColor = '#CD7F32'; // Bronze
        trophyIcon = 'emoji_events';
    }

    return (
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/10 border border-white/10 shadow-sm relative overflow-hidden group hover:bg-white/20 transition-colors">
            {/* Rank Badge */}
            <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 relative z-10"
            style={{ 
                backgroundColor: index < 3 ? `${activeThemeColor}44` : 'rgba(255,255,255,0.1)',
                color: index < 3 ? activeThemeColor : 'white'
            }}
            >
                {index + 1}
            </div>

            <div className="flex-1 min-w-0 z-10">
                <h3 className="font-bold text-base truncate">{score.name}</h3>
                <div className="flex items-center gap-3 text-sm text-white/70">
                    <span className="font-bold text-white">{score.score.toLocaleString()} pts</span>
                    <span className="w-1 h-1 rounded-full bg-white/30"></span>
                    <span className="flex items-center gap-1 opacity-80">
                        <span className="material-symbols-outlined text-xs">timer</span>
                        {formatTime(score.time)}
                    </span>
                </div>
            </div>

            {/* Trophy Icon for Top 3 */}
            {index < 3 && (
                <span 
                    className="material-symbols-outlined absolute -top-1 -right-1 rotate-12 opacity-80 text-5xl z-0"
                    style={{ color: trophyColor }}
                >
                    {trophyIcon}
                </span>
            )}
        </div>
    );
};

const HighScores: React.FC<HighScoresProps> = ({ onBack, activeThemeColor, bgImage }) => {
  // Fetch scores for all levels
  const easyScores = useMemo(() => getHighScores(`${HIGH_SCORES_KEY}_${Difficulty.EASY}`), []);
  const mediumScores = useMemo(() => getHighScores(`${HIGH_SCORES_KEY}_${Difficulty.MEDIUM}`), []);
  const hardScores = useMemo(() => getHighScores(`${HIGH_SCORES_KEY}_${Difficulty.HARD}`), []);

  const renderSection = (title: string, scores: HighScore[]) => (
      <div className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/70 mb-3 ml-2 drop-shadow-md">{title}</h2>
          {scores.length === 0 ? (
              <div className="bg-white/5 rounded-2xl p-6 text-center text-white/40 text-sm italic backdrop-blur-sm border border-white/5">
                  No scores yet.
              </div>
          ) : (
              <div className="flex flex-col gap-2">
                  {scores.map((score, index) => (
                      <ScoreCard key={index} score={score} index={index} activeThemeColor={activeThemeColor} />
                  ))}
              </div>
          )}
      </div>
  );

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto relative text-white">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center p-4 pt-6 bg-black/40 backdrop-blur-md sticky top-0 z-20 border-b border-white/10">
            <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
                <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold flex-1 text-center pr-10 drop-shadow-md">Leaderboard</h1>
        </div>

        <div className="flex-1 p-4 overflow-y-auto pb-10 scrollbar-hide">
            {renderSection("Easy Level", easyScores)}
            {renderSection("Medium Level", mediumScores)}
            {renderSection("Hard Level", hardScores)}
        </div>
      </div>
    </div>
  );
};

export default HighScores;

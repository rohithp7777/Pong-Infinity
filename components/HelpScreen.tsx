
import React from 'react';

interface HelpScreenProps {
  onBack: () => void;
  bgImage: string;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ onBack, bgImage }) => {
  const items = [
    { icon: 'close', bg: '#FDE047', color: '#000', title: 'Multi-Ball', desc: 'Spawns an extra ball and boosts score.' },
    { icon: 'attach_money', bg: '#FFD700', color: '#000', title: 'Bonus Points', desc: 'Instantly adds +500 points to score.' },
    { icon: 'favorite', bg: '#EC4899', color: '#fff', title: 'Life Up', desc: 'Adds +1 Life (Max 10).' },
    { icon: 'heart_broken', bg: '#EF4444', color: '#fff', title: 'Life Down', desc: 'Lose -1 Life immediately.' },
    { icon: 'hourglass_bottom', bg: '#3B82F6', color: '#fff', title: 'Time Extension', desc: 'Adds +20 seconds to timer.' },
    { icon: 'hourglass_full', bg: '#F97316', color: '#fff', title: 'Time Penalty', desc: 'Removes -20 seconds from timer.' },
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto relative text-white overflow-hidden">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center p-4 pt-6 bg-black/40 backdrop-blur-md sticky top-0 z-10 border-b border-white/10">
            <button 
                onClick={onBack}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
                <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold flex-1 text-center pr-10 drop-shadow-md">How to Play</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
            
            {/* Objective */}
            <section>
                <h2 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2 drop-shadow-md">
                    <span className="material-symbols-outlined">flag</span> Objective
                </h2>
                <p className="text-white/90 leading-relaxed text-sm bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    Clear all the bricks before the <b>Timer</b> runs out! Use your paddle to deflect the ball. Don't let the ball fall or you lose a life.
                </p>
            </section>

            {/* Drops */}
            <section>
                <h2 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2 drop-shadow-md">
                    <span className="material-symbols-outlined">stars</span> Items
                </h2>
                <div className="grid gap-3">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                            <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg shrink-0"
                                style={{ backgroundColor: item.bg, color: item.color }}
                            >
                                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">{item.title}</h4>
                                <p className="text-xs text-white/70">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Controls */}
            <section>
                <h2 className="text-lg font-bold text-green-400 mb-2 flex items-center gap-2 drop-shadow-md">
                    <span className="material-symbols-outlined">sports_esports</span> Controls
                </h2>
                <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-2 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-white/60">touch_app</span>
                        <p className="text-sm text-white/90">Touch & Drag to move paddle.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-white/60">keyboard</span>
                        <p className="text-sm text-white/90">Use Arrow Keys on desktop.</p>
                    </div>
                </div>
            </section>

        </div>
      </div>
    </div>
  );
};

export default HelpScreen;


import React from 'react';
import { GameSettings } from '../types';

interface SettingsScreenProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onBack: () => void;
  bgImage: string;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onUpdateSettings, onBack, bgImage }) => {
  const toggleMusic = () => onUpdateSettings({ ...settings, musicEnabled: !settings.musicEnabled });
  const toggleSFX = () => onUpdateSettings({ ...settings, sfxEnabled: !settings.sfxEnabled });

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
            <h1 className="text-xl font-bold flex-1 text-center pr-10 drop-shadow-md">Settings</h1>
        </div>

        <div className="flex-1 p-6 space-y-6">
            <div className="bg-white/10 rounded-2xl p-6 border border-white/10 space-y-6 backdrop-blur-sm">
                
                {/* Music Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${settings.musicEnabled ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/50'}`}>
                            <span className="material-symbols-outlined">{settings.musicEnabled ? 'music_note' : 'music_off'}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Music</h3>
                            <p className="text-xs text-white/60">Ambient theme sounds</p>
                        </div>
                    </div>
                    <button 
                        onClick={toggleMusic}
                        className={`w-14 h-8 rounded-full relative transition-colors duration-300 shadow-inner ${settings.musicEnabled ? 'bg-blue-500' : 'bg-white/20'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-md ${settings.musicEnabled ? 'left-[calc(100%-28px)]' : 'left-1'}`}></div>
                    </button>
                </div>

                <div className="h-px bg-white/10 w-full"></div>

                {/* SFX Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${settings.sfxEnabled ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'}`}>
                            <span className="material-symbols-outlined">{settings.sfxEnabled ? 'volume_up' : 'volume_off'}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Sound Effects</h3>
                            <p className="text-xs text-white/60">Collisions & Power-ups</p>
                        </div>
                    </div>
                    <button 
                        onClick={toggleSFX}
                        className={`w-14 h-8 rounded-full relative transition-colors duration-300 shadow-inner ${settings.sfxEnabled ? 'bg-green-500' : 'bg-white/20'}`}
                    >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-md ${settings.sfxEnabled ? 'left-[calc(100%-28px)]' : 'left-1'}`}></div>
                    </button>
                </div>

            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-center backdrop-blur-sm">
                <p className="text-xs text-white/40">Pong Infinity v1.2</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;

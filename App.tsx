
import React, { useState } from 'react';
import { GameState, ThemeId, Difficulty, GameSettings } from './types';
import { THEMES } from './constants';
import { getSettings, saveSettings } from './utils';
import MainMenu from './components/MainMenu';
import GameEngine from './components/GameEngine';
import HighScores from './components/HighScores';
import HelpScreen from './components/HelpScreen';
import SettingsScreen from './components/SettingsScreen';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>('space');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [settings, setSettings] = useState<GameSettings>(getSettings());

  const currentTheme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];

  const handleStartGame = () => setGameState(GameState.PLAYING);
  const handleShowHighScores = () => setGameState(GameState.HIGH_SCORES);
  const handleShowHelp = () => setGameState(GameState.HELP);
  const handleShowSettings = () => setGameState(GameState.SETTINGS);
  const handleBackToMenu = () => setGameState(GameState.MENU);

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <div className="w-full h-screen bg-black flex justify-center overflow-hidden">
      {gameState === GameState.MENU && (
        <MainMenu 
          onStart={handleStartGame}
          onHighScores={handleShowHighScores}
          onHelp={handleShowHelp}
          onSettings={handleShowSettings}
          currentTheme={currentThemeId}
          onSelectTheme={setCurrentThemeId}
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
        />
      )}

      {gameState === GameState.PLAYING && (
        <GameEngine 
          theme={currentTheme}
          difficulty={difficulty}
          settings={settings}
          onGameOver={() => {}} 
          onBackToMenu={handleBackToMenu}
        />
      )}

      {gameState === GameState.HIGH_SCORES && (
        <HighScores 
          onBack={handleBackToMenu}
          activeThemeColor={currentTheme.primaryColor}
          bgImage={currentTheme.bgImage}
        />
      )}

      {gameState === GameState.HELP && (
        <HelpScreen 
          onBack={handleBackToMenu} 
          bgImage={currentTheme.bgImage}
        />
      )}

      {gameState === GameState.SETTINGS && (
        <SettingsScreen 
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onBack={handleBackToMenu}
          bgImage={currentTheme.bgImage}
        />
      )}
    </div>
  );
};

export default App;

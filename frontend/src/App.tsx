import { useState } from 'react';
import { GameState } from './types';
import { postGame } from './api/client';
import StartScreen  from './components/StartScreen';
import GameScreen   from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import './App.css';

type Screen = 'start' | 'game' | 'result';

export default function App() {
  const [screen,    setScreen]    = useState<Screen>('start');
  const [gameId,    setGameId]    = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  function handleStart(gId: string, state: GameState) {
    setGameId(gId);
    setGameState(state);
    setScreen('game');
  }

  function handleFinish(state: GameState) {
    setGameState(state);
    setScreen('result');
  }

  async function handleNewGame() {
    const { gameId: gId, state } = await postGame();
    handleStart(gId, state);
  }

  if (screen === 'start')  return <StartScreen onStart={handleStart} />;
  if (screen === 'game')   return <GameScreen gameId={gameId!} initialState={gameState!} onFinish={handleFinish} />;
  if (screen === 'result') return <ResultScreen state={gameState!} onNewGame={handleNewGame} />;
  return null;
}

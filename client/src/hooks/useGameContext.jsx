import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { useWebSocketContext } from '@/hooks/useWebSocketContext';

const initialGameState = {
  currentRound: 1,
  get timeLeft() { return 15 },
  gamePhase: "waiting",
  revealedPieces: [],
  selectedQuestion: null,
  playerAnswers: [],
  keyPhraseGuess: null,
  answeredQuestions: [],
  players: [],
  rounds: [],
};

const gameReducer = (state, action) => {
  switch (action.type) {
    default:
      return state;
  }
};

const GameContext = createContext(null);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context)
    throw new Error('GameProvider not found.');
  return context;
};

export const GameProvider = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);

  const { subscribe, sendMessage, isConnected } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribe((rawMsg) => {
      dispatch(JSON.parse(rawMsg.data));
    });
    return unsubscribe;
  }, [subscribe]);
  useEffect(() => {
    if (isConnected) {
      // tell the server to send us init info?
      // or we can send it right on connect
    }
  }, [isConnected]);

  return (
    <GameContext.Provider value={{ gameState }}>
      {children}
    </GameContext.Provider>
  );
};

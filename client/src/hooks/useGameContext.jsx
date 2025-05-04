import React, { createContext, useContext, useEffect, useReducer, useState, useCallback } from 'react';
import { useWebSocketContext } from '@/hooks/useWebSocketContext';

export const GamePhase = {
  CONNECTING: "CONNECTING",
  PLAY: "PLAY",
  QUESTION_RESULTS: "QUESTION_RESULTS",
  GAME_COMPLETE: "COMPLETE",
};

const ServerMessageType = {
  CONNECTION_ACCEPTED: "ACCEPT",
  CONNECTION_DENIED: "DENIED",
  QUESTION: "QUESTION",
  LEADERBOARD: "LEADERBOARD",
  QUESTION_RESULTS: "RESULTS",
};

const ClientMessageType = {
  AUTHENTICATE: "AUTHENTICATE",
  AUTHENTICATE_HOST: "AUTHENTICATE_HOST",
  SUBMIT_ANSWER: "ANSWER",
  SUBMIT_KEYWORD: "KEYWORD",
};

const initialGameState = {
  phase: GamePhase.CONNECTING,
  isPlayer: false,
  revealed: [false, false, false, false, false],
  score: 0,
};

const gameReducer = (state, action) => {
  switch (action.status) {
    case ServerMessageType.CONNECTION_DENIED:
      return { ...state, error: action.message };
    case ServerMessageType.CONNECTION_ACCEPTED:
      return { ...state, phase: GamePhase.WAITING, isPlayer: true };
    case ServerMessageType.QUESTION_RESULTS:
      // TODO
      return { ...state, question: { ...question, results: action } };
    default:
      console.warn("Invalid message from server:", action);
      return state;
  }
};

const GameContext = createContext(null);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context)
    throw new Error('GameContextProvider not found.');
  return context;
};

export const GameContextProvider = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const [authenticated, setAuthenticated] = useState(false);

  const { subscribe, sendMessage, isConnected } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribe((rawMsg) => {
      console.log(rawMsg);
      dispatch(JSON.parse(rawMsg.data));
    });
    return unsubscribe;
  }, [subscribe]);
  useEffect(() => {
    if (isConnected)
      console.log('GameContext connected.');
    else
      setAuthenticated(false);
  }, [isConnected]);

  const authenticate = useCallback((roomID, username) => {
    if (authenticated)
      return;
    setAuthenticated(true);
    sendMessage({ "status": ClientMessageType.AUTHENTICATE, "id": roomID, "name": username });
  });
  const authenticateHost = useCallback((roomID, password) => {
    if (authenticated)
      return;
    setAuthenticated(true);
    sendMessage({ "status": ClientMessageType.AUTHENTICATE_HOST, "id": roomID, "password": password });
  });
  const submitAnswer = useCallback((value) => {
    if (!authenticated)
      return false;
    sendMessage({ "status": ClientMessageType.SUBMIT_ANSWER, "value": value });
    return true;
  });
  const submitKeyword = useCallback((value) => {
    if (!authenticated)
      return false;
    sendMessage({ "status": ClientMessageType.SUBMIT_KEYWORD, "value": value });
    return true;
  });

  return (
    <GameContext.Provider value={{ gameState, authenticate, authenticateHost, submitAnswer, submitKeyword }}>
      {children}
    </GameContext.Provider>
  );
};

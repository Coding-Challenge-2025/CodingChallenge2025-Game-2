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
  QUESTION_LOAD: "QLOAD",
  KEYWORD_PROPERTIES: "KEYIMG",
  QUESTION_START: "QRUN",
  END_LEADERBOARD: "LEADERBOARD",
  QUESTION_RESULTS: "ROUNDSCORE",
  CLUE: "CLUE",
  CHECK_ANSWER: "ANSCHECK",
  CHECK_KEYWORD: "KEYCHECK",
  GAME_END: "END",
};

const ClientMessageType = {
  AUTHENTICATE: "LOGIN",
  AUTHENTICATE_HOST: "LOGIN_HOST",
  SUBMIT_ANSWER: "ANSWER",
  SUBMIT_KEYWORD: "KEYWORD",
};

const initialGameState = {
  phase: GamePhase.CONNECTING,
  isPlayer: false,
  revealed: Array(12).fill(false),
  score: 0,
  questionsAnswered: 0,
};

const gameReducer = (state, action) => {
  switch (action.status) {
    case ServerMessageType.CONNECTION_DENIED:
      return { ...state, error: action.message.reason };
    case ServerMessageType.CONNECTION_ACCEPTED:
      return { ...state, phase: GamePhase.PLAY, isPlayer: true };
    case ServerMessageType.GAME_END:
      return { ...state, phase: GamePhase.GAME_COMPLETE };
    case ServerMessageType.QUESTION_LOAD:
      return {
        ...state, phase: GamePhase.PLAY,
        question: {
          text: action.message.question,
          id: action.message.piece_index
        }, timeStart: undefined,
      };
    case ServerMessageType.KEYWORD_PROPERTIES:
      return {
        ...state,
        keywordLength: action.message.keyword_length,
        image: action.message.image
      };
    case ServerMessageType.CLUE:
      if (!action.message.clue)
        return { ...state };
      let revealed = state.revealed.slice(0);
      revealed[state.question.id] = true;
      return { ...state, revealed: revealed };
    case ServerMessageType.END_LEADERBOARD:
      return { ...state, phase: GamePhase.GAME_COMPLETE, players: action.message };
    case ServerMessageType.QUESTION_START:
      return { ...state, timeStart: Date.now() };
    case ServerMessageType.CHECK_ANSWER:
      return {
        ...state, question: {
          ...state.question, correct: action.message.is_correct,
          answer: action.message.correct_answer
        },
      };
    case ServerMessageType.QUESTION_RESULTS:
      return { ...state, questionsAnswered: state.questionsAnswered + 1 };
    default:
      console.warn("Invalid message from server:", action);
      return { ...state };
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
  const [timeLeft, setTimeLeft] = useState(undefined);

  const { subscribe, sendMessage, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (gameState.timeStart !== undefined) {
      setTimeLeft(20 - Math.floor((Date.now() - gameState.timeStart) / 1000));

      const intervalId = setInterval(() => {
        setTimeLeft(prevTimeLeft => {
          if (prevTimeLeft > 0) {
            return prevTimeLeft - 1;
          } else {
            clearInterval(intervalId);
            return 0;
          }
        });
      }, 1000);

      return () => clearInterval(intervalId);
    } else {
      setTimeLeft(undefined);
    }
  }, [gameState.timeStart]);

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
    sendMessage({
      "status": ClientMessageType.AUTHENTICATE,
      "message": { "id": roomID, "name": username }
    });
  });
  const authenticateHost = useCallback((roomID, password) => {
    if (authenticated)
      return;
    setAuthenticated(true);
    // TODO
    // sendMessage({ "status": ClientMessageType.AUTHENTICATE_HOST, "id": roomID, "password": password });
  });
  const submitAnswer = useCallback((value) => {
    if (!authenticated)
      return false;
    sendMessage({ "status": ClientMessageType.SUBMIT_ANSWER, "message": { "answer": value } });
    return true;
  });
  const submitKeyword = useCallback((value) => {
    if (!authenticated)
      return false;
    sendMessage({ "status": ClientMessageType.SUBMIT_KEYWORD, "message": { "keyword": value } });
    return true;
  });

  return (
    <GameContext.Provider value={{ gameState, authenticate, authenticateHost, submitAnswer, submitKeyword, timeLeft }}>
      {children}
    </GameContext.Provider>
  );
};

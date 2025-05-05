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

  HOST_KEYWORD_PROPERTIES: "HOSTKEYIMG",
  HOST_KEYWORD_QUEUE: "KEYQUEUE",
  HOST_ANSWER_QUEUE: "ANSQUEUE",
};

const ClientMessageType = {
  AUTHENTICATE: "LOGIN",
  AUTHENTICATE_HOST: "HLOGIN",
  SUBMIT_ANSWER: "ANSWER",
  SUBMIT_KEYWORD: "KEYWORD",

  START_GAME: "HOSTGS",
  END_GAME: "HOSTGE",
  SELECT_QUESTION: "CHOOSEPIECE",
  START_QUESTION: "HOSTQRUN",
  OPEN_CLUE: "OCLUE",
  WINNER_FOUND: "KEYRESOLVE",
};

const initialGameState = {
  gameStarted: false,
  phase: GamePhase.CONNECTING,
  revealed: Array(12).fill(false),
  score: 0,
  questionsAnswered: 0,
};

const gameReducer = (state, action) => {
  switch (action.status) {
    case ServerMessageType.CONNECTION_DENIED:
      return { ...state, error: action.message.reason };
    case ServerMessageType.CONNECTION_ACCEPTED:
      return { ...state, phase: GamePhase.PLAY };
    case ServerMessageType.GAME_START:
      return { ...state, gameStarted: true };
    case ServerMessageType.GAME_END:
      return { ...state, phase: GamePhase.GAME_COMPLETE, gameStarted: false };
    case ServerMessageType.QUESTION_LOAD:
      return {
        ...state, phase: GamePhase.PLAY,
        question: {
          text: action.message.question,
          id: action.message.piece_index
        }, timeStart: undefined,
        keywords: undefined, answers: undefined, // host
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
      return { ...state, phase: GamePhase.QUESTION_RESULTS, players: action.message };
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

    case ServerMessageType.HOST_KEYWORD_PROPERTIES:
      return { ...state, ...action.message };
    case ServerMessageType.HOST_KEYWORD_QUEUE:
      return { ...state, keywords: action.message };
    case ServerMessageType.HOST_ANSWER_QUEUE:
      return { ...state, answers: action.message };
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

  // TODO: ???
  const authenticate = useCallback((roomID, username) => {
    if (authenticated)
      return;
    setAuthenticated(true);
    sendMessage({
      "status": ClientMessageType.AUTHENTICATE,
      "message": { "id": roomID, "name": username }
    });
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

  const authenticateHost = useCallback((roomID, password) => {
    if (authenticated)
      return;
    setAuthenticated(true);
    sendMessage({ "status": ClientMessageType.AUTHENTICATE_HOST, message: { "id": roomID, "password": password } });
  });

  const startGame = useCallback(() => {
    if (!isConnected) {
      console.log("startGame called but not connected.");
      return;
    }
    sendMessage({ "status": ClientMessageType.START_GAME });
  });
  const endGame = useCallback(() => {
    if (!isConnected) {
      console.log("endGame called but not connected.");
      return;
    }
    sendMessage({ "status": ClientMessageType.END_GAME });
  });
  const selectQuestion = useCallback((id) => {
    if (!isConnected) {
      console.log("selectQuestion called but not connected.");
      return;
    }
    sendMessage({ status: ClientMessageType.SELECT_QUESTION, message: { piece_index: id } });
  });
  const startQuestion = useCallback(() => {
    if (!isConnected) {
      console.log("startQuestion called but not connected.");
      return;
    }
    sendMessage({ status: ClientMessageType.START_QUESTION });
  });
  const revealClue = useCallback((id) => {
    if (!isConnected) {
      console.log("revealClue called but not connected.");
      return;
    }
    sendMessage({ status: ClientMessageType.OPEN_CLUE, message: { piece_index: id } });
  });
  const notifyCorrectKeyword = useCallback((name) => {
    if (!isConnected) {
      console.log("notifyCorrectKeyword called but not connected.");
      return;
    }
    sendMessage({ status: ClientMessageType.WINNER_FOUND, message: { name: name } });
  });

  const value = {
    gameState,
    timeLeft,

    authenticate,
    submitAnswer,
    submitKeyword,

    authenticateHost,
    startGame,
    endGame,
    selectQuestion,
    startQuestion,
    revealClue,
    notifyCorrectKeyword,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

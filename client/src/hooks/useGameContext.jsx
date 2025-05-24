import React, { createContext, useContext, useEffect, useReducer, useState, useCallback } from 'react';
import { useWebSocketContext } from '@/hooks/useWebSocketContext';

export const GamePhase = {
  CONNECTING: "CONNECTING",
  PLAY: "PLAY",
  QUESTION_RESULTS: "QUESTION_RESULTS",
  GAME_COMPLETE: "COMPLETE",
};

const ServerMessageType = {
  NOTIFY: "NOTIFY",
  HOST_NOTIFY: "HOSTNOTIFY",
  CONNECTION_ACCEPTED: "ACCEPT",
  CONNECTION_DENIED: "DENIED",
  QUESTION_LOAD: "QLOAD",
  KEYWORD_PROPERTIES: "KEYIMG",
  QUESTION_START: "QRUN",
  END_LEADERBOARD: "LEADERBOARD",
  QUESTION_RESULTS: "ROUNDSCORE",
  CLUE: "CLUE",
  CHECK_ANSWER: "ANSCHECK",
  CHECK_KEYWORD: "KEYRESOLVE",
  GAME_START: "START",
  GAME_END: "END",
  PLAYER_WIN: "WIN",
  PLAYER_LOSE: "LOSE",
  SHOW_KEYWORD: "KEYSHOW",

  HOST_KEYWORD_PROPERTIES: "HOSTKEYIMG",
  KEYWORD_NOTIFY: "KEYNOTIFY",
  HOST_ANSWER_QUEUE: "ANSQUEUE",
  HOST_CLIENT_LIST: "CLIENTSLIST",
  HOST_QUESTION_LOAD: "HOSTQLOAD",
  HOST_TIMES_UP: "TIMESUP",
};

const ClientMessageType = {
  AUTHENTICATE: "LOGIN",
  AUTHENTICATE_HOST: "HLOGIN",
  AUTHENTICATE_AUDIENCE: "AALOGIN",
  SUBMIT_ANSWER: "ANSWER",
  SUBMIT_KEYWORD: "KEYWORD",

  START_GAME: "HOSTGS",
  END_GAME: "HOSTGE",
  SELECT_QUESTION: "CHOOSEPIECE",
  START_QUESTION: "HOSTQRUN",
  OPEN_CLUE: "OCLUE",
  RESOLVE_KEYWORD: "KEYRESOLVE",
  RESOLVE_ANSWERS: "ANSRESOLVE",
  SHOW_KEYWORD: "KEYSHOW",
  REVEAL_ROUND_SCORE: "GETROUNDSCORE",
  REVEAL_LEADERBOARDS: "GETLEADERBOARD",
  REQUEST_CLIENT_LIST: "GETCLIENTS",
};

const InternalMessageType = {
  SET_AUDIENCE: "SET_AUDIENCE",
  CLEAR_ANSWER_QUEUE: "CLEAR_ANSWER_QUEUE",
  UPDATE_KEYWORD_QUEUE: "UPDATE_KEYWORD_QUEUE",
  MARK_ANSWER: "MARK_ANSWER",
  MARK_KEYWORD: "MARK_KEYWORD",
  REVEAL_ALL_CLUES: "REVEAL_ALL_CLUES",
};

const initialGameState = {
  gameStarted: false,
  phase: GamePhase.CONNECTING,
  revealed: Array(12).fill(false),
  score: 0,
  questionsAnswered: 0,
  isPlayer: true,
  answerQueue: [],
  keywordQueue: [],
  wrongKeywords: [],
  notifications: [],
};

const gameReducer = (state, action) => {
  switch (action.status) {
    case ServerMessageType.HOST_NOTIFY:
    case ServerMessageType.NOTIFY:
      return { ...state, notifications: [{ time: new Date(), message: action.message.message }, ...state.notifications] };
    case ServerMessageType.CONNECTION_DENIED:
      sessionStorage.clear(); // don't try to reconnect with stale data
      return { ...state, error: action.message.reason };
    case ServerMessageType.CONNECTION_ACCEPTED:
      return { ...state, phase: GamePhase.PLAY };
    case ServerMessageType.GAME_START:
      return { ...state, gameStarted: true };
    case ServerMessageType.GAME_END:
      sessionStorage.clear(); // don't try to reconnect if we're done
      return {
        ...state, phase: GamePhase.GAME_COMPLETE, gameStarted: false,
        keyword: action.message.keyword, revealed: action.message.clues,
      };
    case ServerMessageType.HOST_QUESTION_LOAD:
    case ServerMessageType.QUESTION_LOAD: {
      let revealed = state.revealed.slice(0);
      if (state.phase === GamePhase.QUESTION_RESULTS && !revealed[state.question.id])
        revealed[state.question.id] = "";
      return {
        ...state, phase: GamePhase.PLAY,
        question: {
          text: action.message.question,
          id: action.message.piece_index,
          answer: action.message.answer,
        }, timeStart: undefined,
        revealed: revealed,
        keywords: undefined, answers: undefined, answerQueue: [],// host
        wrongKeywords: [...state.wrongKeywords,
        ...state.keywordQueue.filter(x => !x.correct).map(x => x.keyword)],
        keywordQueue: [],
      };
    }
    case ServerMessageType.HOST_KEYWORD_PROPERTIES:
    case ServerMessageType.KEYWORD_PROPERTIES:
      return {
        ...state,
        keywordLength: action.message.keyword_length,
        keyword: action.message.keyword,
        image: action.message.image
      };
    case ServerMessageType.CLUE:
      let revealed = state.revealed.slice(0);
      revealed[action.message.piece_index] = action.message.clue ?? "";
      return { ...state, revealed: revealed };
    case ServerMessageType.END_LEADERBOARD:
      return { ...state, phase: GamePhase.QUESTION_RESULTS, players: action.message };
    case ServerMessageType.QUESTION_START:
      return { ...state, timeStart: Date.now(), timeAllotted: action.message.time };
    case ServerMessageType.CHECK_ANSWER: {
      let answerQueue = state.answerQueue;
      if (answerQueue.length > 0) {
        answerQueue = answerQueue.map((item) => {
          let correct = item.name === action.message.name ? !!action.message.correct : item.correct;
          return { ...item, correct: correct };
        });
      }
      return {
        ...state, question: {
          ...state.question, correct: action.message.correct,
          answer: action.message.correct_answer
        },
        answerQueue: answerQueue,
      };
    }
    case ServerMessageType.QUESTION_RESULTS:
      return {
        ...state, phase: GamePhase.QUESTION_RESULTS,
        questionsAnswered: state.questionsAnswered + 1, players: action.message
      };
    case ServerMessageType.KEYWORD_NOTIFY:
      return { ...state, keywordQueue: [...state.keywordQueue, action.message] };
    case ServerMessageType.HOST_ANSWER_QUEUE:
      return { ...state, answerQueue: action.message };
    case ServerMessageType.HOST_CLIENT_LIST:
      return { ...state, connectedPlayers: action.message.players };
    case ServerMessageType.CHECK_KEYWORD:
      return {
        ...state, keywordQueue: state.keywordQueue.map((item) => {
          let correct = item.name === action.message.name ? !!action.message.correct : item.correct;
          return { ...item, correct: correct };
        })
      };
    case ServerMessageType.SHOW_KEYWORD:
      return {
        ...state, keywordQueue: state.keywordQueue.map((item) => {
          if (item.name === action.message.name)
            return { ...item, visible: true };
          return { ...item };
        })
      };
    case InternalMessageType.SET_AUDIENCE:
    case ServerMessageType.PLAYER_WIN:
    case ServerMessageType.PLAYER_LOSE:
      return { ...state, isPlayer: false };

    case InternalMessageType.CLEAR_ANSWER_QUEUE:
      return { ...state, answerQueue: [] };
    // case InternalMessageType.UPDATE_KEYWORD_QUEUE:
    //   return { ...state, keywordQueue: [] };
    case InternalMessageType.MARK_ANSWER: {
      let queue = state.answerQueue.slice(0);
      queue[action.message.id].correct = action.message.value;
      return { ...state, answerQueue: queue };
    }
    case InternalMessageType.MARK_KEYWORD: {
      let queue = state.keywordQueue.slice(0);
      queue[action.message.id].correct = action.message.value;
      return { ...state, keywordQueue: queue };
    }
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
      setTimeLeft(Math.floor((gameState.timeAllotted - (Date.now() - gameState.timeStart)) / 1000));

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
  }, [gameState.timeStart, gameState.timeAllotted]);

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
    sessionStorage.roomID = roomID;
    sessionStorage.username = username;
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

  const authenticateAudience = useCallback((roomID) => {
    if (authenticated)
      return;
    setAuthenticated(true);
    sessionStorage.roomID = roomID;
    sendMessage({ "status": ClientMessageType.AUTHENTICATE_AUDIENCE, message: { "id": roomID, "name": Date.now().toString() } });
    dispatch({ status: InternalMessageType.SET_AUDIENCE });
  });

  const authenticateHost = useCallback((password) => {
    if (authenticated)
      return;
    setAuthenticated(true);
    sessionStorage.password = password;
    sendMessage({ "status": ClientMessageType.AUTHENTICATE_HOST, message: { password: password } });
    dispatch({ status: InternalMessageType.SET_AUDIENCE });
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
  const revealClue = useCallback(() => {
    if (!isConnected) {
      console.log("revealClue called but not connected.");
      return;
    }
    sendMessage({ status: ClientMessageType.OPEN_CLUE });
  });
  const resolveAnswers = useCallback(() => {
    if (!isConnected) {
      console.log("resolveAnswers called but not connected.");
      return;
    }
    sendMessage({ status: ClientMessageType.RESOLVE_ANSWERS, message: gameState.answerQueue });
    dispatch({ status: InternalMessageType.CLEAR_ANSWER_QUEUE });
  });
  const revealPlayerKeyword = useCallback((name) => {
    if (!isConnected) {
      console.log("revealPlayerKeyword called but not connected.");
      return;
    }
    sendMessage({ status: ClientMessageType.SHOW_KEYWORD, message: { name: name } });
  });
  const resolveKeyword = useCallback((name, correct) => {
    if (!isConnected) {
      console.log("resolveKeyword called but not connected.");
      return;
    }
    sendMessage({ status: ClientMessageType.RESOLVE_KEYWORD, message: { name: name, correct: correct } });
    // dispatch({ status: InternalMessageType.UPDATE_KEYWORD_QUEUE, message: {name: name, correct: correct} });
  });
  const revealRoundScore = useCallback(() => {
    if (!isConnected) {
      console.log("revealRoundScore called but not connected.");
      return;
    }
    sendMessage({ status: ClientMessageType.REVEAL_ROUND_SCORE });
  });
  const revealLeaderboards = useCallback(() => {
    if (!isConnected) {
      console.log("revealLeaderboards called but not connected.");
      return;
    }
    sendMessage({ status: ClientMessageType.REVEAL_LEADERBOARDS });
  });
  const requestClientList = useCallback(() => {
    if (!isConnected) {
      console.log("requestClientList called but not connected.");
      return;
    }
    sendMessage({ status: ClientMessageType.REQUEST_CLIENT_LIST });
  });

  const markAnswer = useCallback((id, value) =>
    dispatch({ status: InternalMessageType.MARK_ANSWER, message: { id: id, value: value } }));
  const markKeyword = useCallback((id, value) =>
    dispatch({ status: InternalMessageType.MARK_KEYWORD, message: { id: id, value: value } }));
  const value = {
    gameState,
    timeLeft,

    authenticate,
    submitAnswer,
    submitKeyword,

    authenticateAudience,

    authenticateHost,
    startGame,
    endGame,
    selectQuestion,
    startQuestion,
    revealClue,
    resolveAnswers,
    revealRoundScore,
    revealLeaderboards,
    markAnswer,
    markKeyword,
    requestClientList,

    resolveKeyword,
    revealPlayerKeyword,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ url, children }) => {
  const [messageListeners, setMessageListeners] = useState(new Set());

  const { sendJsonMessage, getWebSocket, readyState, lastMessage } = useWebSocket(url, {
    onOpen: () => console.log('WebSocket open.'),
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onMessage: (event) => {
      console.log(event);
      messageListeners.forEach((listener) => {
        listener(event);
      });
    },
    retryOnError: true,
  });

  const subscribe = useCallback((listener) => {
    setMessageListeners((prevListeners) => new Set(prevListeners).add(listener));
    return () => { // unsubscribe fn
      setMessageListeners((prevListeners) => {
        const newListeners = new Set(prevListeners);
        newListeners.delete(listener);
        return newListeners;
      });
    };
  }, [setMessageListeners]);

  const value = {
    sendMessage: sendJsonMessage,
    lastMessage,
    readyState,
    getWebSocket,
    isConnected: readyState === ReadyState.OPEN,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('WebSocketProvider not found.');
  }
  return context;
};

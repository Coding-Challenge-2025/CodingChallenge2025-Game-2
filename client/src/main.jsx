import { StrictMode, Suspense, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  useNavigate,
  useRoutes,
} from 'react-router-dom'
import routes from '~react-pages'
import './index.css'
import { WebSocketProvider } from '@/hooks/useWebSocketContext';
import { GameContextProvider } from '@/hooks/useGameContext'
import { useGameContext } from './hooks/useGameContext'
import { useWebSocketContext } from './hooks/useWebSocketContext'

function App() {
  const { isConnected } = useWebSocketContext();
  const { authenticate } = useGameContext();
  const navigate = useNavigate();
  const element = useRoutes(routes);

  useEffect(() => {
    if (!isConnected)
      return;
    // if (sessionStorage.password)
    //   authenticateHost(sessionStorage.password);
    // else
    if (sessionStorage.username) {
      authenticate(sessionStorage.roomID, sessionStorage.username);
      navigate("/player/game");
    }
    // else if (sessionStorage.roomID)
    //   authenticateAudience(sessionStorage.roomID);
  }, [isConnected]);

  if (!isConnected)
    return <p>Connecting to server...</p>;
  return (
    <Suspense fallback={<p>Loading...</p>}>
      {element}
    </Suspense>
  )
}

const wsHost = window.location.hostname;
const wsPort = '3000';
const wsUrl = `ws://${wsHost}:${wsPort}`;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <WebSocketProvider url={wsUrl}>
        <GameContextProvider>
          <App />
        </GameContextProvider>
      </WebSocketProvider>
    </BrowserRouter>
  </StrictMode>,
)

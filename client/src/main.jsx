import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  useRoutes,
} from 'react-router-dom'
import routes from '~react-pages'
import './index.css'
import { WebSocketProvider } from '@/hooks/useWebSocketContext';
import { GameContextProvider } from '@/hooks/useGameContext'

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      {useRoutes(routes)}
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

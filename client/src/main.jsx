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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <WebSocketProvider url="ws://localhost:3000">
        <GameContextProvider>
          <App />
        </GameContextProvider>
      </WebSocketProvider>
    </BrowserRouter>
  </StrictMode>,
)

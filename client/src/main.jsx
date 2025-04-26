import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import {
  BrowserRouter,
  useRoutes,
} from 'react-router-dom'
import routes from '~react-pages'
import './index.css'
import { WebSocketProvider } from '@/hooks/useWebSocketContext';

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
      <WebSocketProvider url="ws://echo.websocket.org">
        <App />
      </WebSocketProvider>
    </BrowserRouter>
  </StrictMode>,
)

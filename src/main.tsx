import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress React DevTools message in console
if (typeof window !== 'undefined') {
  const noop = () => { };
  const DEV_TOOLS = '__REACT_DEVTOOLS_GLOBAL_HOOK__';
  if (typeof window[DEV_TOOLS as keyof Window] === 'undefined') {
    (window as any)[DEV_TOOLS] = { isDisabled: true, supportsFiber: true, inject: noop, onCommitFiberRoot: noop, onCommitFiberUnmount: noop };
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

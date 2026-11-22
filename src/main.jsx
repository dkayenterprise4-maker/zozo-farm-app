import '@fontsource/source-sans-3/latin-400.css'
import '@fontsource/source-sans-3/latin-600.css'
import '@fontsource/source-sans-3/latin-700.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { StoreProvider } from './lib/store'
import { ConfirmProvider } from './components/ui'
import './index.css'

// Offline support: caches the app on the phone after the first visit.
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <StoreProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </StoreProvider>
    </HashRouter>
  </React.StrictMode>
)

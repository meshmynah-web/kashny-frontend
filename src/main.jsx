import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { OfflineProvider } from './context/OfflineContext'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OfflineProvider>
          <App />
          <Toaster position="top-right" 
                   toastOptions={{
                     style: {
                       background: '#1e293b',
                       color: '#fff',
                       border: '1px solid rgba(255,255,255,0.1)'
                     }
                   }} />
        </OfflineProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

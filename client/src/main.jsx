import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { StoreProvider } from 'easy-peasy'
import store from './store'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <StoreProvider store={store}>
        <App />
      </StoreProvider>
    </Router>
  </React.StrictMode>
)
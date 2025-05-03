import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import axios from 'axios'

// Set base URL for API requests to match backend
axios.defaults.baseURL = 'http://localhost:5000'
// Enable credentials for session cookies
axios.defaults.withCredentials = true

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { RouterProvider } from 'react-router'
import router from '@/lib/router'

import { BrowserRouter as Router } from 'react-router-dom'
const container = document.getElementById('root')

if (container) {
    const root = createRoot(container)
    root.render(
        <React.StrictMode>
            <Router>
                <App />
            </Router>
        </React.StrictMode>
    )
} else {
    console.error('Root element not found')
}

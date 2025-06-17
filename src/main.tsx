import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router'
import router from '@/lib/router'

const container = document.getElementById('root')

if (container) {
    const root = createRoot(container)
    root.render(
        <React.StrictMode>
            <RouterProvider router={router} />
        </React.StrictMode>
    )
} else {
    console.error('Root element not found')
}

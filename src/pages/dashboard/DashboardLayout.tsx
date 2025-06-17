// layouts/RootLayout.jsx
import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'

function DashboardLayout() {
    const location = useLocation()

    // You can add global components here like a Header, Footer, etc.
    // Or add logic to conditionally render different layouts
    // For example, if you want a different layout for auth pages vs app pages

    return (
        <div>
            {/* You could add a global header/navbar here */}
            {/* <Header /> */}

            {/* This is where the nested routes will render */}
            <Outlet />

            {/* You could add a global footer here */}
            {/* <Footer /> */}
        </div>
    )
}

export default DashboardLayout

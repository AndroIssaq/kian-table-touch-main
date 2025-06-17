import { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'

interface AdminProtectedRouteProps {
    children: ReactNode
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
    const { session, isAdmin, isLoading } = useAuth()
    const location = useLocation()

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className='flex items-center justify-center min-h-screen'>
                Loading...
            </div>
        )
    }
    // Redirect to admin login if not authenticated
    if (session && !isAdmin) {
        return <Navigate to='/sign-in' state={{ from: location }} replace />
    }

    // Render children if authenticated
    return <Outlet />
}
export default AdminProtectedRoute

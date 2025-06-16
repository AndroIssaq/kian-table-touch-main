import { createBrowserRouter } from 'react-router-dom'
import AdminAuth from '@/pages/AdminAuth'
import CallWaiter from '@/pages/CallWaiter'
import CategoryMenu from '@/pages/CategoryMenu'
import CategoryProducts from '@/pages/CategoryProducts'
import ChooseTable from '@/pages/ChooseTable'
import LoyaltyManagement from '@/pages/LoyaltyManagement'
import Menu from '@/pages/Menu'
import MenuDashboard from '@/pages/menuDashboard'
import NotFound from '@/pages/NotFound'
import Reports from '@/pages/Reports'
import SignInPage from '@/pages/SignInPage'
import SignUpPage from '@/pages/SignUpPage'
import StaffDashboard from '@/pages/StaffDashboard'
import UserHome from '@/pages/UserHome'
import UsersDashboard from '@/pages/UsersDashboard'
import VerificationCode from '@/pages/VerificationCode'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'

const router = createBrowserRouter([
    {
        path: '/',
        Component: VerificationCode, // Corresponds to the initial path='/' element
    },
    {
        // A conceptual route to group user-protected routes.
        // We'll use ProtectedRoute as the Component that renders an <Outlet /> for its children.
        path: '/', // This path makes the children relative to root.
        Component: ProtectedRoute, // This acts as the layout/wrapper for user routes
        children: [
            {
                path: 'user-home',
                Component: UserHome,
            },
            {
                path: 'menu',
                Component: Menu,
            },
            {
                path: 'call-waiter',
                Component: CallWaiter,
            },
            {
                path: 'menu/category/:id',
                Component: CategoryMenu,
            },
        ],
    },
    {
        path: '/choose-table', // This route is not wrapped by ProtectedRoute in your original XML
        Component: ChooseTable,
    },
    {
        path: '/admin-auth',
        Component: AdminAuth,
    },
    {
        // A conceptual route to group admin-protected routes
        path: '/', // This path makes the children relative to root.
        Component: AdminProtectedRoute, // This acts as the layout/wrapper for admin routes
        children: [
            {
                path: 'staff-dashboard',
                Component: StaffDashboard,
            },
            {
                path: 'loyalty-management',
                Component: LoyaltyManagement,
            },
            {
                path: 'reports',
                Component: Reports,
            },
            {
                path: 'menu-dashboard',
                Component: MenuDashboard,
            },
            {
                path: 'users-dashboard',
                Component: UsersDashboard,
            },
            {
                path: 'menu-dashboard/category/:id', // Nested under admin protected, but could be separate
                Component: CategoryProducts,
            },
        ],
    },
    // Other routes
    {
        path: '/sign-in/*', // Wildcard paths work similarly
        Component: SignInPage,
    },
    {
        path: '/sign-up/*',
        Component: SignUpPage,
    },
    {
        path: '*', // Catch-all route for 404
        Component: NotFound,
    },
])

export default router

import { createBrowserRouter } from 'react-router-dom'
import {
    ChooseTable,
    CategoryProducts,
    CallWaiter,
    CategoryMenu,
    LoyaltyManagement,
    Menu,
    MenuDashboard,
    NotFound,
    Reports,
    SignInPage,
    SignUpPage,
    StaffDashboard,
    UserHome,
    UsersDashboard,
    VerificationCode,
    DashboardLayout,
} from '@/pages'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import App from '@/App'

const router = createBrowserRouter([
    {
        path: '/',
        Component: App,
        children: [
            {
                index: true,
                Component: VerificationCode,
            },
            {
                path: 'sign-in/*',
                Component: SignInPage,
            },
            {
                path: 'sign-up/*',
                Component: SignUpPage,
            },
            {
                path: '/',
                Component: ProtectedRoute,
                children: [
                    {
                        path: 'choose-table',
                        Component: ChooseTable,
                    },
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
                path: '/',
                Component: AdminProtectedRoute,
                children: [
                    {
                        path: 'dashboard',
                        Component: DashboardLayout,
                        children: [
                            {
                                path: '/dashboard',
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
                                path: 'menu',
                                Component: MenuDashboard,
                            },
                            {
                                path: 'users',
                                Component: UsersDashboard,
                            },
                            {
                                path: 'menu/category/:id',
                                Component: CategoryProducts,
                            },
                        ],
                    },
                ],
            },
            {
                path: '*',
                Component: NotFound,
            },
        ],
    },
])

export default router

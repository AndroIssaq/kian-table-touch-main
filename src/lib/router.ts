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
import { da } from 'date-fns/locale'

// const router = createBrowserRouter([
//     {
//         path: '/',
//         Component: VerificationCode, // Corresponds to the initial path='/' element
//     },
//     {
//         // A conceptual route to group user-protected routes.
//         // We'll use ProtectedRoute as the Component that renders an <Outlet /> for its children.
//         path: '/', // This path makes the children relative to root.
//         Component: ProtectedRoute, // This acts as the layout/wrapper for user routes
//         children: [
//             {
//                 path: 'user-home',
//                 Component: UserHome,
//             },
//             {
//                 path: 'choose-table', // This route is not wrapped by ProtectedRoute in your original XML
//                 Component: ChooseTable,
//             },
//             {
//                 path: 'menu',
//                 Component: Menu,
//             },
//             {
//                 path: 'call-waiter',
//                 Component: CallWaiter,
//             },
//             {
//                 path: 'menu/category/:id',
//                 Component: CategoryMenu,
//             },
//         ],
//     },

//     {
//         // A conceptual route to group admin-protected routes
//         path: '/', // This path makes the children relative to root.
//         Component: AdminProtectedRoute, // This acts as the layout/wrapper for admin routes
//         children: [
//             {
//                 path: 'staff-dashboard',
//                 Component: StaffDashboard,
//             },
//             {
//                 path: 'loyalty-management',
//                 Component: LoyaltyManagement,
//             },
//             {
//                 path: 'reports',
//                 Component: Reports,
//             },
//             {
//                 path: 'menu-dashboard',
//                 Component: MenuDashboard,
//             },
//             {
//                 path: 'users-dashboard',
//                 Component: UsersDashboard,
//             },
//             {
//                 path: 'menu-dashboard/category/:id', // Nested under admin protected, but could be separate
//                 Component: CategoryProducts,
//             },
//         ],
//     },
//     // Other routes
//     {
//         path: '/sign-in/*', // Wildcard paths work similarly
//         Component: SignInPage,
//     },
//     {
//         path: '/sign-up/*',
//         Component: SignUpPage,
//     },
//     {
//         path: '*', // Catch-all route for 404
//         Component: NotFound,
//     },
// ])
const router = createBrowserRouter([
    {
        path: '/',
        // Use a single top-level Component that acts as the main layout
        // This component will contain logic or additional Outlet to render children.
        Component: App, // <-- You'll create this component
        children: [
            {
                index: true, // This makes VerificationCode the default child at '/'
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
            // Grouping User Protected Routes under a common layout
            {
                path: '/', // This `path` ensures its children are absolute from root
                Component: ProtectedRoute, // This acts as the layout/wrapper for user routes
                children: [
                    {
                        path: 'choose-table', // Now correctly relative to the parent '/'
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
            // Grouping Admin Protected Routes under a common layout
            {
                path: '/', // This `path` ensures its children are absolute from root
                Component: AdminProtectedRoute, // This acts as the layout/wrapper for admin routes
                children: [
                    {
                        path: 'dashboard',
                        Component: DashboardLayout, // Assuming you have a DashboardLayout component
                        children: [
                            {
                                path: '/dashboard',
                                Component: StaffDashboard, // Default child for dashboard
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
            // Catch-all route for 404 - typically the last route
            {
                path: '*',
                Component: NotFound,
            },
        ],
    },
])

export default router

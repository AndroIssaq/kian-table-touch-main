// External Libraries
import { ClerkProvider } from '@clerk/clerk-react'
import { arSA } from '@clerk/localizations'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Routes, Route } from 'react-router-dom'

// Components
import { Toaster } from '@/components/ui/toaster'
import CentralLoader from '@/components/CentralLoader'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'

// Pages
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

// Contexts
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { LoadingProvider } from '@/contexts/LoadingContext'
import { LoyaltyPointsProvider } from '@/contexts/LoyaltyPointsContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/useAuth'

// Create a query client instance
const queryClient = new QueryClient()

function App() {
    return (
        <ClerkProvider
            localization={arSA}
            telemetry={false}
            publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
            appearance={{
                variables: {
                    colorPrimary: '#d39d28',
                    colorText: '#d39d28',
                    colorBackground: '#d39d28',
                    colorInputBackground: '#d39d28',
                    colorInputText: '#d39d28',
                    colorDanger: '#d39d28',
                    fontFamily: 'Cairo, sans-serif',
                    borderRadius: '1.5rem',
                },
            }}
        >
            <QueryClientProvider client={queryClient}>
                <LoadingProvider>
                    <CentralLoader />
                    <ThemeProvider>
                        <LanguageProvider>
                            <CartProvider>
                                <AuthProvider>
                                    <LoyaltyPointsProvider>
                                        <Toaster />
                                        <Routes>
                                            <Route
                                                path='/'
                                                element={<VerificationCode />}
                                            />
                                            {/* Protected User Routes */}
                                            <Route
                                                path='/user-home'
                                                element={
                                                    <ProtectedRoute>
                                                        <UserHome />
                                                    </ProtectedRoute>
                                                }
                                            />

                                            {/* Protected User Routes */}
                                            <Route
                                                path='/choose-table'
                                                element={
                                                    <ProtectedRoute>
                                                        <ChooseTable />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path='/menu'
                                                element={
                                                    <ProtectedRoute>
                                                        <Menu />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path='/call-waiter'
                                                element={
                                                    <ProtectedRoute>
                                                        <CallWaiter />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path='/menu/category/:id'
                                                element={<CategoryMenu />}
                                            />

                                            {/* Admin Auth Route */}
                                            <Route
                                                path='/admin-auth'
                                                element={<AdminAuth />}
                                            />

                                            {/* Protected Admin Routes */}
                                            <Route
                                                path='/staff-dashboard'
                                                element={
                                                    <AdminProtectedRoute>
                                                        <StaffDashboard />
                                                    </AdminProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path='/loyalty-management'
                                                element={
                                                    <AdminProtectedRoute>
                                                        <LoyaltyManagement />
                                                    </AdminProtectedRoute>
                                                }
                                            />

                                            {/* Reports Route */}
                                            <Route
                                                path='/reports'
                                                element={
                                                    <AdminProtectedRoute>
                                                        <Reports />
                                                    </AdminProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path='/menu-dashboard'
                                                element={
                                                    <AdminProtectedRoute>
                                                        <MenuDashboard />
                                                    </AdminProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path='/users-dashboard'
                                                element={
                                                    <AdminProtectedRoute>
                                                        <UsersDashboard />
                                                    </AdminProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path='/menu-dashboard/category/:id'
                                                element={<CategoryProducts />}
                                            />
                                            {/* Other routes */}
                                            <Route
                                                path='*'
                                                element={<NotFound />}
                                            />
                                            <Route
                                                path='/sign-in/*'
                                                element={<SignInPage />}
                                            />
                                            <Route
                                                path='/sign-up/*'
                                                element={<SignUpPage />}
                                            />
                                        </Routes>
                                    </LoyaltyPointsProvider>
                                </AuthProvider>
                            </CartProvider>
                        </LanguageProvider>
                    </ThemeProvider>
                </LoadingProvider>
            </QueryClientProvider>
        </ClerkProvider>
    )
}

export default App

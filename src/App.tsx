// External Libraries
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Components
import { Toaster } from '@/components/ui/toaster'
import CentralLoader from '@/components/CentralLoader'

// Contexts
import { CartProvider } from '@/contexts/useCart'
import { LanguageProvider } from '@/contexts/useLanguage'
import { LoadingProvider } from '@/contexts/useLoading'
import { LoyaltyPointsProvider } from '@/contexts/useLoyaltyPoints'
import { ThemeProvider } from '@/contexts/useTheme'
import { AuthProvider } from '@/contexts/useAuth'
import { Outlet } from 'react-router'

// Create a query client instance
const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <LoadingProvider>
                <CentralLoader />
                <ThemeProvider>
                    <LanguageProvider>
                        <CartProvider>
                            <AuthProvider>
                                <LoyaltyPointsProvider>
                                    <Toaster />
                                    <Outlet />
                                </LoyaltyPointsProvider>
                            </AuthProvider>
                        </CartProvider>
                    </LanguageProvider>
                </ThemeProvider>
            </LoadingProvider>
        </QueryClientProvider>
    )
}

export default App

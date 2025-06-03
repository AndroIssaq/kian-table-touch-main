import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/ChooseTable";
import CallWaiter from "./pages/CallWaiter";
import Menu from "./pages/Menu";
import NotFound from "./pages/NotFound";
import StaffDashboard from "./pages/StaffDashboard";
import LoyaltyManagement from "./pages/LoyaltyManagement";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import VerificationCode from "./pages/VerificationCode";
import ChooseTable from "./pages/ChooseTable";
import ProtectedRoute from "./components/ProtectedRoute";
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import AdminAuth from '@/pages/AdminAuth';
import Reports from "@/pages/Reports";
import { Loader2 } from "lucide-react";
import { LoadingProvider } from "@/contexts/LoadingContext";
import CentralLoader from "@/components/CentralLoader";
import CategoryMenu from "@/pages/CategoryMenu";
import { CartProvider } from "@/contexts/CartContext";
import { ClerkProvider } from '@clerk/clerk-react';
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import UserHome from "./pages/UserHome";
import { LoyaltyPointsProvider } from '@/contexts/LoyaltyPointsContext';

// Create a query client instance
const queryClient = new QueryClient();

function App() {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: '#8B1E3F',
          colorText: '#23243a',
          colorBackground: '#f9f6ff',
          colorInputBackground: '#fff',
          colorInputText: '#23243a',
          colorDanger: '#b91c1c',
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
                <AdminAuthProvider>
                  <LoyaltyPointsProvider>
                    <Toaster />
                    <Routes>
                      <Route path="/" element={<VerificationCode />} />
                        {/* Protected User Routes */}
                      <Route path="/user-home" element={
                        <ProtectedRoute>
                          <UserHome />
                        </ProtectedRoute>
                      } />
                      
                      {/* Protected User Routes */}
                      <Route path="/choose-table" element={
                        <ProtectedRoute>
                          <ChooseTable />
                        </ProtectedRoute>
                      } />
                      <Route path="/menu" element={
                        <ProtectedRoute>
                          <Menu />
                        </ProtectedRoute>
                      } />
                      <Route path="/call-waiter" element={
                        <ProtectedRoute>
                          <CallWaiter />
                        </ProtectedRoute>
                      } />
                      <Route path="/menu/category/:id" element={<CategoryMenu />} />
                      
                      {/* Admin Auth Route */}
                      <Route path="/admin-auth" element={<AdminAuth />} />
                      
                      {/* Protected Admin Routes */}
                      <Route path="/staff-dashboard" element={
                        <AdminProtectedRoute>
                          <StaffDashboard />
                        </AdminProtectedRoute>
                      } />
                      <Route path="/loyalty-management" element={
                        <AdminProtectedRoute>
                          <LoyaltyManagement />
                        </AdminProtectedRoute>
                      } />
                      
                      {/* Reports Route */}
                      <Route path="/reports" element={
                        <AdminProtectedRoute>
                          <Reports />
                        </AdminProtectedRoute>
                      } />
                      {/* Other routes */}
                      <Route path="*" element={<NotFound />} />
                      <Route path="/sign-in" element={<SignInPage />} />
                      <Route path="/sign-up" element={<SignUpPage />} />
                    </Routes>
                  </LoyaltyPointsProvider>
                </AdminAuthProvider>
              </CartProvider>
            </LanguageProvider>
          </ThemeProvider>
        </LoadingProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;

import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {  Routes, Route } from "react-router-dom";
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
import { arSA } from '@clerk/localizations';
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import UserHome from "./pages/UserHome";
import { LoyaltyPointsProvider } from '@/contexts/LoyaltyPointsContext';
import MenuDashboard from "./pages/menuDashboard";
import CategoryProducts from "./pages/CategoryProducts";
import UsersDashboard from "./pages/UsersDashboard";

// Create a query client instance
const queryClient = new QueryClient();

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
              <CartProvider >
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
                      <Route path="/choose-table" element={<ChooseTable />} />
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
                      <Route path="/menu-dashboard" element={
                        <AdminProtectedRoute>
                          <MenuDashboard />
                        </AdminProtectedRoute>
                      } />
                      <Route path="/users-dashboard" element={
                        <AdminProtectedRoute>
                          <UsersDashboard />
                        </AdminProtectedRoute>
                      } />
                      <Route path="/menu-dashboard/category/:id" element={<CategoryProducts />} />
                      {/* Other routes */}
                      <Route path="*" element={<NotFound />} />
                      <Route path="/sign-in/*" element={<SignInPage />} />
                      <Route path="/sign-up/*" element={<SignUpPage />} />
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


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

// Create a query client instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AdminAuthProvider>
            <Toaster />
            <Routes>
              <Route path="/" element={<VerificationCode />} />
              
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
              
              {/* Other routes */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AdminAuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

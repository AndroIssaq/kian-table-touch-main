// --- AdminAuth Page ---
import React, { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Lock, User } from "lucide-react";
import ThemeLanguageToggle from "@/components/ThemeLanguageToggle";
import PageTransition from "@/components/PageTransition";

// --- Helper: Password Toggle Button ---
const PasswordToggle: React.FC<{
  show: boolean;
  onClick: () => void;
}> = ({ show, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
    aria-label={show ? "Hide password" : "Show password"}
    tabIndex={-1}
  >
    {show ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
        <line x1="2" x2="22" y1="2" y2="22"></line>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    )}
  </button>
);

const AdminAuth: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login } = useAdminAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from state or default to staff dashboard
  const from: string = location.state?.from?.pathname || "/staff-dashboard";

  // Handle form submit
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !password) {
      toast({
        title: t("error") || "Error",
        description: t("allFieldsRequired") || "All fields are required",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const success = await login(name, password);
      if (success) {
        toast({
          title: t("success") || "Success",
          description: t("loginSuccessful") || "Login successful",
        });
        navigate(from);
      } else {
        toast({
          title: t("error") || "Error",
          description: t("invalidCredentials") || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Login error:", error);
      toast({
        title: t("error") || "Error",
        description: t("loginFailed") || "Login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render ---
  return (
    <PageTransition>
      <div className="cafe-container">
        <div className="mb-6">
          <ThemeLanguageToggle />
        </div>
        <motion.div
          className="max-w-md mx-auto mt-8 p-6 bg-background rounded-xl shadow-md border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-center mb-6 text-gradient">
            {t("adminLogin") || "Admin Login"}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                {t("username") || "Username"}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  className="pl-10"
                  placeholder={t("enterUsername") || "Enter username"}
                  autoComplete="username"
                />
              </div>
            </div>
            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t("Password") || "Password"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder={t("enterPassword") || "Enter password"}
                  autoComplete="current-password"
                />
                {/* Password visibility toggle */}
                <PasswordToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} />
              </div>
            </div>
            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                t("loggingIn") || "Logging in..."
              ) : (
                t("login") || "Login"
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AdminAuth;
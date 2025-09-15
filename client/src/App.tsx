import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button"; // ✅ Added this import
import { useAuth } from "./hooks/useAuth";
import Home from "@/pages/Home";
import ProfilePage from "./pages/ProfilePage";
import AuthForm from "./components/AuthForm";
import PasswordResetForm from "./components/PasswordResetForm";
import EmailVerificationBanner from "./components/EmailVerificationBanner";
import { useEffect } from "react";

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Loading AgroLink...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Connecting to your farming community
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/reset-password">
            <PasswordResetForm />
          </Route>
          <Route path="/profile">
            {isAuthenticated ? (
              <>
                <EmailVerificationBanner />
                <ProfilePage />
              </>
            ) : (
              <AuthForm />
            )}
          </Route>
          <Route path="/">
            {isAuthenticated ? (
              <>
                <EmailVerificationBanner />
                <Home />
              </>
            ) : (
              <AuthForm />
            )}
          </Route>
          <Route>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  404 - Page Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  The page you're looking for doesn't exist.
                </p>
                <Button onClick={() => (window.location.href = "/")}>
                  Go Home
                </Button>
              </div>
            </div>
          </Route>
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

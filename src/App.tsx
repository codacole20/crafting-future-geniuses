import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AppNavigation } from "./components/AppNavigation";
import { useEffect, useState } from "react";

// Pages
import SplashScreen from "./pages/SplashScreen";
import Onboarding from "./pages/Onboarding";
import QuestTrail from "./pages/QuestTrail";
import Chat from "./pages/Chat";
import ProjectHub from "./pages/ProjectHub";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// A wrapper to check if user needs onboarding
const AppRoutes = () => {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(() => {
    return localStorage.getItem("hasCompletedOnboarding") !== "true";
  });
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // Don't show navigation on splash screen or onboarding
  const shouldShowNavigation = !showSplash && 
    location.pathname !== "/onboarding" && 
    !isFirstVisit;

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <>
      <Routes>
        <Route path="/onboarding" element={<Onboarding onComplete={() => {
          localStorage.setItem("hasCompletedOnboarding", "true");
          setIsFirstVisit(false);
        }} />} />
        <Route path="/" element={isFirstVisit ? <Navigate to="/onboarding" replace /> : <QuestTrail />} />
        <Route path="/chat" element={isFirstVisit ? <Navigate to="/onboarding" replace /> : <Chat />} />
        <Route path="/projects" element={isFirstVisit ? <Navigate to="/onboarding" replace /> : <ProjectHub />} />
        <Route path="/settings" element={isFirstVisit ? <Navigate to="/onboarding" replace /> : <Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {shouldShowNavigation && <AppNavigation />}
    </>
  );
};

import { GuestUserProvider } from "./hooks/useGuestUser";

function App() {
  return (
    <GuestUserProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-ct-paper">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </GuestUserProvider>
  );
}

export default App;

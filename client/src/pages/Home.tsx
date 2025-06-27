import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/use-toast';
import AuthForm from '../components/AuthForm';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import Dashboard from '../components/Dashboard';
import TontineView from '../components/TontineView';
import MarketView from '../components/MarketView';
import WeatherView from '../components/WeatherView';
import CommunityView from '../components/CommunityView';
import BottomNavigation from '../components/BottomNavigation';
import GuidedTour from '../components/GuidedTour';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showTour, setShowTour] = useState(false);

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show tour for new users
  useEffect(() => {
    if (isAuthenticated && !localStorage.getItem('tourCompleted')) {
      setTimeout(() => setShowTour(true), 1000);
    }
  }, [isAuthenticated]);

  // Session expired listener
  useEffect(() => {
    const handleSessionExpired = () => {
      toast({
        title: t('sessionExpired'),
        variant: 'destructive',
      });
    };

    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, [t, toast]);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setIsSideMenuOpen(false);
  };

  const closeSideMenu = () => {
    setIsSideMenuOpen(false);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'tontine':
        return <TontineView />;
      case 'market':
        return <MarketView />;
      case 'weather':
        return <WeatherView />;
      case 'community':
        return <CommunityView />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header 
        isOnline={isOnline}
        onMenuToggle={() => setIsSideMenuOpen(!isSideMenuOpen)}
      />
      
      <SideMenu 
        isOpen={isSideMenuOpen}
        onClose={closeSideMenu}
        user={user}
      />
      
      {/* Menu Overlay */}
      {isSideMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeSideMenu}
        />
      )}
      
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-16 left-0 right-0 bg-alert-red text-white text-center py-2 text-sm z-40">
          <i className="fas fa-wifi-slash mr-2"></i>
          {t('offlineMessage')}
        </div>
      )}
      
      {/* Main Content */}
      <main className={`pt-16 pb-20 transition-all duration-300 ${!isOnline ? 'pt-24' : ''}`}>
        {renderCurrentView()}
      </main>
      
      <BottomNavigation 
        currentView={currentView}
        onViewChange={handleViewChange}
      />
      
      {showTour && (
        <GuidedTour onComplete={() => setShowTour(false)} />
      )}
    </div>
  );
}

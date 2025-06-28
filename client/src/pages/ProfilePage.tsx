import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import UserProfile from '../components/UserProfile';
import BottomNavigation from '../components/BottomNavigation';
import { useState } from 'react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to view your profile
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header isOnline={true} onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} />
      
      <main className="pt-16 pb-20">
        <UserProfile />
      </main>

      <BottomNavigation 
        currentView="profile" 
        onViewChange={(view) => {
          if (view === 'home') {
            window.location.href = '/';
          }
        }} 
      />
    </div>
  );
}
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  isOnline: boolean;
  onMenuToggle: () => void;
}

export default function Header({ isOnline, onMenuToggle }: HeaderProps) {
  const { t } = useLanguage();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-farm-green shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <button 
          onClick={onMenuToggle}
          className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors touch-target"
          aria-label="Toggle menu"
        >
          <i className="fas fa-bars text-xl"></i>
        </button>
        
        <div className="flex items-center space-x-2">
          <i className="fas fa-leaf text-white text-lg"></i>
          <h1 className="text-white text-xl font-bold">
            {t('headerTitle')}
          </h1>
        </div>
        
        {/* Connection Status and Logout */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'online-indicator' : 'offline-indicator'}`}></div>
            <span className="text-white text-sm font-medium">
              {isOnline ? t('online') : t('offline')}
            </span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors touch-target"
            aria-label="Logout"
            title="Logout"
          >
            <i className="fas fa-sign-out-alt text-lg"></i>
          </button>
        </div>
      </div>
    </header>
  );
}

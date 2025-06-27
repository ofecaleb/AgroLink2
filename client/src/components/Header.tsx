import { useLanguage } from '../hooks/useLanguage';

interface HeaderProps {
  isOnline: boolean;
  onMenuToggle: () => void;
}

export default function Header({ isOnline, onMenuToggle }: HeaderProps) {
  const { t } = useLanguage();

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
        
        {/* Connection Status Indicator */}
        <div className="flex items-center space-x-1">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'online-indicator' : 'offline-indicator'}`}></div>
          <span className="text-white text-sm font-medium">
            {isOnline ? t('online') : t('offline')}
          </span>
        </div>
      </div>
    </header>
  );
}

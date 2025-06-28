import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { User, Language } from '../types';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function SideMenu({ isOpen, onClose, user }: SideMenuProps) {
  const { logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const handleLanguageChange = () => {
    changeLanguage(selectedLanguage);
    setShowLanguageModal(false);
    onClose();
    toast({
      title: t('languageUpdated'),
    });
  };

  const handleThemeToggle = () => {
    toggleTheme();
    onClose();
  };

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-farm-green rounded-full flex items-center justify-center">
              <i className="fas fa-user text-white text-lg"></i>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {user?.name || 'Farmer'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.phone || '+237 6XX XXX XXX'}
              </p>
            </div>
          </div>
        </div>
        
        <nav className="py-4">
          <a 
            href="/profile"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('navigate', { detail: 'profile' }));
              onClose();
            }}
            className="flex items-center w-full px-6 py-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-user-cog w-6 mr-4 text-farm-green"></i>
            <span>Profile Settings</span>
          </a>
          
          <button 
            onClick={() => setShowLanguageModal(true)}
            className="flex items-center w-full px-6 py-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-language w-6 mr-4 text-farm-green"></i>
            <span>{t('language')}</span>
          </button>
          
          <button 
            onClick={handleThemeToggle}
            className="flex items-center w-full px-6 py-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} w-6 mr-4 text-farm-green`}></i>
            <span>{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
          </button>
          
          <button 
            onClick={() => {
              toast({
                title: t('premiumFeatures'),
                description: 'Coming soon!',
              });
              onClose();
            }}
            className="flex items-center w-full px-6 py-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-crown w-6 mr-4 text-harvest-orange"></i>
            <span>{t('premiumFeatures')}</span>
          </button>
          
          <button 
            onClick={() => {
              toast({
                title: t('helpSupport'),
                description: 'Contact support at help@agrolink.cm',
              });
              onClose();
            }}
            className="flex items-center w-full px-6 py-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-question-circle w-6 mr-4 text-farm-green"></i>
            <span>{t('helpSupport')}</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-6 py-4 text-alert-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <i className="fas fa-sign-out-alt w-6 mr-4"></i>
            <span>{t('logout')}</span>
          </button>
        </nav>
      </div>

      {/* Language Selection Modal */}
      <Dialog open={showLanguageModal} onOpenChange={setShowLanguageModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <i className="fas fa-language text-farm-green mr-2"></i>
              {t('selectLanguageTitle')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {(['en', 'fr', 'pid'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedLanguage === lang
                    ? 'bg-farm-green text-white'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-white'
                }`}
              >
                <span className="font-medium">
                  {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'Pidgin'}
                </span>
                {selectedLanguage === lang && (
                  <i className="fas fa-check"></i>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowLanguageModal(false)}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleLanguageChange}
              className="flex-1 bg-farm-green hover:bg-farm-green/90"
            >
              {t('confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

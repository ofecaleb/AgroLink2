import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GuidedTourProps {
  onComplete: () => void;
}

export default function GuidedTour({ onComplete }: GuidedTourProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps = [
    {
      icon: 'fas fa-leaf',
      title: t('tourWelcomeTitle'),
      description: t('tourWelcomeText'),
    },
    {
      icon: 'fas fa-bars',
      title: 'Navigation Menu',
      description: 'Tap the menu button to access language settings, dark mode, and premium features.',
    },
    {
      icon: 'fas fa-money-bill',
      title: 'Digital Tontines',
      description: 'Join or create tontine groups to save money with your farming community. All transactions are secure with 2% platform fee.',
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Market Prices',
      description: 'Check real-time crop prices in your region. Submit price updates to help fellow farmers get better deals.',
    },
    {
      icon: 'fas fa-cloud-sun',
      title: 'Weather & Farming Alerts',
      description: 'Get weather forecasts and farming alerts to make informed decisions about planting and harvesting.',
    },
    {
      icon: 'fas fa-users',
      title: 'Community Feed',
      description: 'Connect with farmers in your region. Share experiences, ask questions, and help each other succeed.',
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Mobile Money Integration',
      description: 'Make secure payments using MTN Mobile Money or Orange Money for tontine contributions.',
    },
    {
      icon: 'fas fa-wifi-slash',
      title: 'Offline Support',
      description: 'AgroLink works offline too! Your data is cached so you can access important information anytime.',
    }
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const completeTour = () => {
    localStorage.setItem('tourCompleted', 'true');
    onComplete();
  };

  const currentTourStep = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-farm-green rounded-full flex items-center justify-center mx-auto mb-6">
            <i className={`${currentTourStep.icon} text-white text-2xl`}></i>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            {currentTourStep.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {currentTourStep.description}
          </p>
          
          {/* Progress Indicators */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-farm-green'
                    : index < currentStep
                    ? 'bg-farm-green/50'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          {/* Step Counter */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Step {currentStep + 1} of {tourSteps.length}
          </p>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="flex-1"
            >
              {t('skipTour')}
            </Button>
            <Button 
              onClick={handleNext}
              className="flex-1 bg-farm-green hover:bg-farm-green/90"
            >
              {currentStep === tourSteps.length - 1 ? 'Get Started' : t('nextTour')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

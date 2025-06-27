import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Language } from '../types';

export default function AuthForm() {
  const { login, register, isLoading } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const { toast } = useToast();
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    pin: '',
    name: '',
    region: 'bamenda'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.pin) {
      toast({
        title: t('fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.pin.length !== 4 || !/^\d+$/.test(formData.pin)) {
      toast({
        title: t('pinLength'),
        variant: 'destructive',
      });
      return;
    }

    if (isRegisterMode) {
      if (!formData.name) {
        toast({
          title: t('fillAllFields'),
          variant: 'destructive',
        });
        return;
      }

      const result = await register(formData);
      if (result.success) {
        toast({
          title: t('registrationSuccess'),
        });
        setIsRegisterMode(false);
        setFormData(prev => ({ ...prev, name: '' }));
      } else {
        toast({
          title: result.error || t('connectionError'),
          variant: 'destructive',
        });
      }
    } else {
      const result = await login(formData.phone, formData.pin);
      if (result.success) {
        toast({
          title: t('loginSuccess'),
        });
      } else {
        toast({
          title: result.error || t('invalidCredentials'),
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="min-h-screen gradient-farm flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="w-20 h-20 bg-farm-green rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-leaf text-white text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {t('welcomeTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {t('welcomeSubtitle')}
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegisterMode && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center">
                    <i className="fas fa-user mr-2 text-farm-green"></i>
                    {t('nameLabel')}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Farmer"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input-farm text-lg"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center">
                  <i className="fas fa-phone mr-2 text-farm-green"></i>
                  {t('phoneLabel')}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+237 6XX XXX XXX"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input-farm text-lg"
                />
              </div>
              
              {isRegisterMode && (
                <div className="space-y-2">
                  <Label htmlFor="region" className="flex items-center">
                    <i className="fas fa-map-marker-alt mr-2 text-farm-green"></i>
                    {t('regionLabel')}
                  </Label>
                  <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                    <SelectTrigger className="input-farm text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bamenda">Bamenda</SelectItem>
                      <SelectItem value="douala">Douala</SelectItem>
                      <SelectItem value="yaounde">Yaoundé</SelectItem>
                      <SelectItem value="bafoussam">Bafoussam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="pin" className="flex items-center">
                  <i className="fas fa-lock mr-2 text-farm-green"></i>
                  {isRegisterMode ? t('createPinLabel') : t('pinLabel')}
                </Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••"
                  maxLength={4}
                  value={formData.pin}
                  onChange={(e) => handleInputChange('pin', e.target.value)}
                  className="input-farm text-lg text-center tracking-widest"
                />
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-farm text-lg py-4"
                >
                  {isLoading ? (
                    <div className="loading-spinner mr-2"></div>
                  ) : (
                    <i className={`fas ${isRegisterMode ? 'fa-user-plus' : 'fa-sign-in-alt'} mr-2`}></i>
                  )}
                  {isRegisterMode ? t('createAccountBtn') : t('loginBtn')}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="w-full text-lg py-4 btn-outline-farm"
                >
                  <i className={`fas ${isRegisterMode ? 'fa-arrow-left' : 'fa-user-plus'} mr-2`}></i>
                  {isRegisterMode ? t('backToLoginBtn') : t('registerBtn')}
                </Button>
              </div>

              {!isRegisterMode && (
                <div className="text-center">
                  <button 
                    type="button"
                    className="text-farm-green hover:text-farm-green/80 text-sm font-medium"
                    onClick={() => toast({ title: 'Contact support for PIN reset' })}
                  >
                    {t('forgotPin')}
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Language Selector */}
        <div className="text-center mt-6">
          <div className="inline-flex rounded-lg bg-white/20 p-1">
            {(['en', 'fr', 'pid'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => changeLanguage(lang)}
                className={`px-3 py-2 rounded-md text-white text-sm font-medium transition-colors ${
                  language === lang ? 'bg-white/20' : 'hover:bg-white/20'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

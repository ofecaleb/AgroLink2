import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { countries, languages, getRegionsByCountry } from '../lib/countries';
import { ApiService } from '../lib/api';

export default function UserProfile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || 'CM',
    region: user?.region || '',
    language: user?.language || 'en',
    profilePicture: user?.profilePicture || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => ApiService.updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      setIsEditing(false);
      toast({
        title: 'Profile updated successfully!',
        description: 'Your information has been saved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => ApiService.updateUserProfile(data),
    onSuccess: () => {
      setShowPasswordChange(false);
      setPasswordData({ currentPin: '', newPin: '', confirmPin: '' });
      toast({
        title: 'PIN changed successfully!',
        description: 'Your PIN has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to change PIN',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, profilePicture: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      country: user?.country || 'CM',
      region: user?.region || '',
      language: user?.language || 'en',
      profilePicture: user?.profilePicture || ''
    });
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (passwordData.newPin !== passwordData.confirmPin) {
      toast({
        title: 'PINs do not match',
        variant: 'destructive',
      });
      return;
    }
    if (passwordData.newPin.length !== 4 || !/^\d+$/.test(passwordData.newPin)) {
      toast({
        title: 'PIN must be exactly 4 digits',
        variant: 'destructive',
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPin: passwordData.currentPin,
      newPin: passwordData.newPin,
    });
  };

  const selectedCountry = countries.find(c => c.code === formData.country);
  const availableRegions = getRegionsByCountry(formData.country);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <i className="fas fa-user-circle mr-2 text-farm-green"></i>
              User Profile
            </CardTitle>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <i className="fas fa-edit mr-2"></i>
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={updateProfileMutation.isPending}
                  className="bg-farm-green hover:bg-farm-green/90"
                >
                  {updateProfileMutation.isPending ? (
                    <div className="loading-spinner mr-2"></div>
                  ) : (
                    <i className="fas fa-save mr-2"></i>
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={formData.profilePicture} />
              <AvatarFallback className="bg-farm-green text-white text-2xl">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <div className="flex-1 space-y-3">
                <div>
                  <Label htmlFor="profilePictureFile">Upload Picture</Label>
                  <Input
                    id="profilePictureFile"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="input-farm"
                  />
                </div>
                <div>
                  <Label htmlFor="profilePicture">Or paste image URL</Label>
                  <Input
                    id="profilePicture"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.profilePicture}
                    onChange={(e) => handleInputChange('profilePicture', e.target.value)}
                    className="input-farm"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                className="input-farm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                className="input-farm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 rounded-md border">
                  <span className="text-lg mr-1">{selectedCountry?.flag}</span>
                  <span className="text-sm font-medium">{selectedCountry?.phoneCode}</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  className="input-farm flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select 
                value={formData.country} 
                onValueChange={(value) => handleInputChange('country', value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="input-farm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center">
                        <span className="mr-2">{country.flag}</span>
                        {country.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region/City</Label>
              <Select 
                value={formData.region} 
                onValueChange={(value) => handleInputChange('region', value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="input-farm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region.charAt(0).toUpperCase() + region.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select 
                value={formData.language} 
                onValueChange={(value) => handleInputChange('language', value)}
                disabled={!isEditing}
              >
                <SelectTrigger className="input-farm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name} ({lang.nativeName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Account Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Account Balance</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <span className="text-lg font-semibold text-farm-green">
                  {selectedCountry?.currency === 'XAF' ? 'FCFA' : selectedCountry?.currency} {user?.balance?.toLocaleString() || '0'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-between">
                <span className="capitalize">{user?.plan || 'Free'} Plan</span>
                {user?.plan === 'free' && (
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <i className="fas fa-crown mr-1"></i>
                    Upgrade
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Member Since</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Last Active</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                {user?.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-shield-alt mr-2 text-farm-green"></i>
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Change PIN</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update your 4-digit PIN for account security
              </p>
            </div>
            <Button 
              onClick={() => setShowPasswordChange(!showPasswordChange)} 
              variant="outline"
            >
              {showPasswordChange ? 'Cancel' : 'Change PIN'}
            </Button>
          </div>

          {showPasswordChange && (
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPin">Current PIN</Label>
                  <Input
                    id="currentPin"
                    type="password"
                    placeholder="••••"
                    maxLength={4}
                    value={passwordData.currentPin}
                    onChange={(e) => handlePasswordChange('currentPin', e.target.value)}
                    className="input-farm text-center tracking-widest"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPin">New PIN</Label>
                  <Input
                    id="newPin"
                    type="password"
                    placeholder="••••"
                    maxLength={4}
                    value={passwordData.newPin}
                    onChange={(e) => handlePasswordChange('newPin', e.target.value)}
                    className="input-farm text-center tracking-widest"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPin">Confirm New PIN</Label>
                  <Input
                    id="confirmPin"
                    type="password"
                    placeholder="••••"
                    maxLength={4}
                    value={passwordData.confirmPin}
                    onChange={(e) => handlePasswordChange('confirmPin', e.target.value)}
                    className="input-farm text-center tracking-widest"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => setShowPasswordChange(false)} 
                  variant="outline" 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                  className="flex-1 bg-farm-green hover:bg-farm-green/90"
                >
                  {changePasswordMutation.isPending ? (
                    <div className="loading-spinner mr-2"></div>
                  ) : (
                    <i className="fas fa-key mr-2"></i>
                  )}
                  Update PIN
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
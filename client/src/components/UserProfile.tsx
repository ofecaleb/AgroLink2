import { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Shield, 
  Settings, 
  CreditCard, 
  Camera, 
  Upload,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Crown
} from 'lucide-react';
import { countries, getRegionsByCountry } from '../lib/countries';

export default function UserProfile() {
  const { user, logout, refreshProfile } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showPins, setShowPins] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    country: user?.country || 'CM',
    region: user?.region || 'bamenda',
    language: user?.language || 'en'
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPin: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });

  const [setPasswordFormData, setSetPasswordFormData] = useState({
    currentPin: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('/api/user/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (response.ok) {
        await refreshProfile();
        toast({
          title: 'Profile picture updated successfully',
        });
      } else {
        const error = await response.json();
        toast({
          title: error.error || 'Failed to update profile picture',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to update profile picture',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        await refreshProfile();
        toast({
          title: 'Profile updated successfully',
        });
      } else {
        const error = await response.json();
        toast({
          title: error.error || 'Failed to update profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          currentPin: passwordData.currentPin || undefined,
          currentPassword: passwordData.currentPassword || undefined,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        toast({
          title: 'Password changed successfully',
        });
        setPasswordData({
          currentPin: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        toast({
          title: error.error || 'Failed to change password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (setPasswordFormData.newPassword !== setPasswordFormData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          currentPin: setPasswordFormData.currentPin,
          newPassword: setPasswordFormData.newPassword
        })
      });

      if (response.ok) {
        toast({
          title: 'Password set successfully',
        });
        setSetPasswordFormData({
          currentPin: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        toast({
          title: error.error || 'Failed to set password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to set password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = async () => {
    if (pinData.newPin !== pinData.confirmPin) {
      toast({
        title: 'PINs do not match',
        variant: 'destructive',
      });
      return;
    }

    if (pinData.newPin.length !== 4 || !/^\d+$/.test(pinData.newPin)) {
      toast({
        title: 'PIN must be exactly 4 digits',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/pin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          currentPin: pinData.currentPin,
          newPin: pinData.newPin
        })
      });

      if (response.ok) {
        toast({
          title: 'PIN changed successfully',
        });
        setPinData({
          currentPin: '',
          newPin: '',
          confirmPin: ''
        });
      } else {
        const error = await response.json();
        toast({
          title: error.error || 'Failed to change PIN',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to change PIN',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"><Crown className="w-3 h-3 mr-1" />Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Admin</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">User</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              {/* Profile Picture Section */}
              <div className="relative">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white dark:border-gray-800 shadow-lg">
                  <AvatarImage src={user.profilePicture} alt={user.name} />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {user.name}
                  </h1>
                  {getRoleBadge(user.role)}
          </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-center md:justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    {user.phone}
                  </div>
                  <div className="flex items-center justify-center md:justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    {user.email}
                  </div>
                  <div className="flex items-center justify-center md:justify-start">
                    <MapPin className="w-4 h-4 mr-2" />
                    {user.region}, {user.country}
                  </div>
                  <div className="flex items-center justify-center md:justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {user.balance} CFA
                    </div>
                    <div className="text-xs text-gray-500">Balance</div>
                  </div>
                  <Separator orientation="vertical" className="h-8 hidden sm:block" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {user.plan}
                    </div>
                    <div className="text-xs text-gray-500">Plan</div>
                  </div>
                </div>
              </div>
          </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Account</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
              />
            </div>
                </div>
                <Button onClick={handleProfileUpdate} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Change Password</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPin">Current PIN (if using PIN)</Label>
                    <div className="relative">
                      <Input
                        id="currentPin"
                        type={showPins.current ? "text" : "password"}
                        placeholder="••••"
                        maxLength={4}
                        value={passwordData.currentPin}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPin: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPins(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPins.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password (if using password)</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button onClick={handlePasswordChange} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>

            {/* Set Password (for users who only have PIN) */}
            <Card>
              <CardHeader>
                <CardTitle>Set Password</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add a password to your account for easier login</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setCurrentPin">Current PIN</Label>
                  <div className="relative">
                    <Input
                      id="setCurrentPin"
                      type={showPins.current ? "text" : "password"}
                      placeholder="••••"
                      maxLength={4}
                      value={setPasswordFormData.currentPin}
                      onChange={(e) => setSetPasswordFormData(prev => ({ ...prev, currentPin: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPins(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPins.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="setNewPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="setNewPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={setPasswordFormData.newPassword}
                        onChange={(e) => setSetPasswordFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setConfirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="setConfirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={setPasswordFormData.confirmPassword}
                        onChange={(e) => setSetPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button onClick={handleSetPassword} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Setting...' : 'Set Password'}
                </Button>
              </CardContent>
            </Card>

            {/* Change PIN */}
            <Card>
              <CardHeader>
                <CardTitle>Change PIN</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPinChange">Current PIN</Label>
                    <div className="relative">
                      <Input
                        id="currentPinChange"
                        type={showPins.current ? "text" : "password"}
                        placeholder="••••"
                        maxLength={4}
                        value={pinData.currentPin}
                        onChange={(e) => setPinData(prev => ({ ...prev, currentPin: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPins(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPins.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
            <div className="space-y-2">
                    <Label htmlFor="newPin">New PIN</Label>
                    <div className="relative">
                      <Input
                        id="newPin"
                        type={showPins.new ? "text" : "password"}
                        placeholder="••••"
                        maxLength={4}
                        value={pinData.newPin}
                        onChange={(e) => setPinData(prev => ({ ...prev, newPin: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPins(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPins.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPin">Confirm New PIN</Label>
                  <div className="relative">
                <Input
                      id="confirmPin"
                      type={showPins.confirm ? "text" : "password"}
                      placeholder="••••"
                      maxLength={4}
                      value={pinData.confirmPin}
                      onChange={(e) => setPinData(prev => ({ ...prev, confirmPin: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPins(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPins.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
              </div>
            </div>
                <Button onClick={handlePinChange} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Changing...' : 'Change PIN'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
                    <Select value={profileData.country} onValueChange={(value) => setProfileData(prev => ({ ...prev, country: value }))}>
                      <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                            {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Select value={profileData.region} onValueChange={(value) => setProfileData(prev => ({ ...prev, region: value }))}>
                      <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                        {getRegionsByCountry(profileData.country).map((region) => (
                    <SelectItem key={region} value={region}>
                      {region.charAt(0).toUpperCase() + region.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
                </div>
            <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={profileData.language} onValueChange={(value) => {
                    setProfileData(prev => ({ ...prev, language: value }));
                    changeLanguage(value as any);
                  }}>
                    <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="pid">Pidgin</SelectItem>
                </SelectContent>
              </Select>
            </div>
                <Button onClick={handleProfileUpdate} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? 'Updating...' : 'Update Preferences'}
                  </Button>
        </CardContent>
      </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
      <Card>
        <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Account Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{user.phone}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(user.role)}
                    </div>
            </div>
                  <div className="space-y-2">
                    <Label>Balance</Label>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{user.balance} CFA</p>
          </div>
                <div className="space-y-2">
                    <Label>Member Since</Label>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <Separator />
                
                <Alert>
                  <AlertDescription>
                    <strong>Account Status:</strong> Your account is active and in good standing.
                  </AlertDescription>
                </Alert>
                
                <Button variant="destructive" onClick={logout} className="w-full md:w-auto">
                  Logout
                </Button>
        </CardContent>
      </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { countries, languages, getRegionsByCountry, getCurrencyByCountry, searchCountries, searchLanguages } from '../lib/countries';
import type { Language } from '../types';
import type { Country } from '../lib/countries';
import { Eye, EyeOff, Mail, Phone, User, MapPin, Globe, Lock, UserPlus, LogIn, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuthForm() {
  const { login, register, resetPassword, isLoading, resendVerificationEmail } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find(c => c.code === 'CM') || countries[0]
  );
  const [countryOpen, setCountryOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    country: 'CM',
    region: 'bamenda',
    language: 'en'
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Filter countries and languages based on search
  const filteredCountries = countrySearch ? searchCountries(countrySearch) : countries;
  const filteredLanguages = languageSearch ? searchLanguages(languageSearch) : languages;

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (mode === 'register') {
      if (!formData.name.trim()) {
        newErrors.name = 'Full name is required';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (formData.phone.length < 8) {
        newErrors.phone = 'Phone number must be at least 8 digits';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (mode === 'login') {
      if (loginMethod === 'email') {
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
      } else {
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        }
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
    } else if (mode === 'reset') {
      if (loginMethod === 'email') {
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
      } else {
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setFormData(prev => ({
      ...prev,
      country: country.code,
      region: country.regions[0] || '',
      language: country.languages[0] || 'en'
    }));
    
    const defaultLanguage = country.languages[0] || 'en';
    changeLanguage(defaultLanguage as Language);
    setCountryOpen(false);
    setCountrySearch('');
  };

  const handleLanguageChange = (langCode: string) => {
    setFormData(prev => ({ ...prev, language: langCode }));
    changeLanguage(langCode as Language);
    setLanguageOpen(false);
    setLanguageSearch('');
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors below',
        variant: 'destructive',
      });
      return;
    }

    if (mode === 'register') {
      const registrationData = {
        email: formData.email.trim(),
        phone: formatPhoneNumber(formData.phone),
        password: formData.password,
        name: formData.name.trim(),
        country: formData.country,
        region: formData.region,
        language: formData.language,
        currency: getCurrencyByCountry(formData.country)
      };

      const result = await register(registrationData);
      
      if (result.success) {
        toast({
          title: 'Account Created Successfully!',
          description: 'Please check your email to verify your account.',
        });
        setVerificationEmailSent(true);
        setMode('login');
        setFormData(prev => ({ 
          ...prev, 
          password: '', 
          confirmPassword: '', 
          name: '' 
        }));
      } else {
        toast({
          title: 'Registration Failed',
          description: result.error || 'Failed to create account',
          variant: 'destructive',
        });
      }
    } else if (mode === 'login') {
      const credentials: LoginCredentials = {
        password: formData.password,
        ...(loginMethod === 'email' 
          ? { email: formData.email.trim() }
          : { phone: formatPhoneNumber(formData.phone) }
        )
      };

      const result = await login(credentials);
      
      if (result.success) {
        toast({
          title: 'Login Successful!',
          description: 'Welcome back to AgroLink',
        });
      } else {
        toast({
          title: 'Login Failed',
          description: result.error || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } else if (mode === 'reset') {
      const resetData = loginMethod === 'email' 
        ? { email: formData.email.trim() }
        : { phone: formatPhoneNumber(formData.phone) };

      const result = await resetPassword(resetData);
      
      if (result.error) {
        toast({
          title: 'Reset Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reset Email Sent!',
          description: result.message || 'Check your email for reset instructions',
        });
        setEmailSent(true);
      }
    }
  };

  const handleResendVerification = async () => {
    const result = await resendVerificationEmail();
    
    if (result.error) {
      toast({
        title: 'Failed to Resend',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Verification Email Sent!',
        description: result.message || 'Check your email for verification link',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="fas fa-leaf text-white text-3xl"></i>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
              AgroLink
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {mode === 'login' && 'Welcome back to your farming community'}
              {mode === 'register' && 'Join the agricultural revolution'}
              {mode === 'reset' && 'Reset your account password'}
            </p>
          </CardHeader>
          
          <CardContent>
            {/* Email Verification Alert */}
            {verificationEmailSent && (
              <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Verification email sent!</strong> Please check your email and click the verification link before logging in.
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={handleResendVerification}
                    className="p-0 h-auto text-blue-600 underline ml-2"
                  >
                    Resend email
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Password Reset Success */}
            {emailSent && mode === 'reset' && (
              <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Reset email sent!</strong> Check your email for password reset instructions.
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={mode} onValueChange={(value) => setMode(value as any)} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login" className="flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </TabsTrigger>
                <TabsTrigger value="reset" className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Login Method Toggle */}
                  <div className="flex items-center justify-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <Button
                      type="button"
                      variant={loginMethod === 'email' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setLoginMethod('email')}
                      className="flex-1"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button
                      type="button"
                      variant={loginMethod === 'phone' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setLoginMethod('phone')}
                      className="flex-1"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Phone
                    </Button>
                  </div>

                  {/* Email/Phone Input */}
                  {loginMethod === 'email' ? (
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-green-600" />
                        Email Address
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="farmer@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`text-lg ${errors.email ? 'border-red-500' : ''}`}
                        autoComplete="email"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="login-phone" className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-green-600" />
                        Phone Number
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 rounded-md border min-w-[100px]">
                          <span className="text-lg mr-1">{selectedCountry.flag}</span>
                          <span className="text-sm font-medium">{selectedCountry.phoneCode}</span>
                        </div>
                        <Input
                          id="login-phone"
                          type="tel"
                          placeholder="6XX XXX XXX"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`text-lg flex-1 ${errors.phone ? 'border-red-500' : ''}`}
                          autoComplete="tel"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-green-600" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`text-lg pr-12 ${errors.password ? 'border-red-500' : ''}`}
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl font-semibold shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <LogIn className="w-5 h-5" />
                        <span>Sign In</span>
                      </div>
                    )}
                  </Button>

                  <div className="text-center">
                    <Button 
                      type="button"
                      variant="link"
                      onClick={() => setMode('reset')}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      Forgot your password?
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                      <User className="w-5 h-5 mr-2 text-green-600" />
                      Personal Information
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-green-600" />
                        Full Name
                      </Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Farmer"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`text-lg ${errors.name ? 'border-red-500' : ''}`}
                        autoComplete="name"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-green-600" />
                        Email Address
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="farmer@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`text-lg ${errors.email ? 'border-red-500' : ''}`}
                        autoComplete="email"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-phone" className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-green-600" />
                        Phone Number
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 rounded-md border min-w-[100px]">
                          <span className="text-lg mr-1">{selectedCountry.flag}</span>
                          <span className="text-sm font-medium">{selectedCountry.phoneCode}</span>
                        </div>
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="6XX XXX XXX"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`text-lg flex-1 ${errors.phone ? 'border-red-500' : ''}`}
                          autoComplete="tel"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Location Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-green-600" />
                      Location & Preferences
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="register-country" className="flex items-center">
                        <Globe className="w-4 h-4 mr-2 text-green-600" />
                        Country
                      </Label>
                      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={countryOpen}
                            className="w-full justify-between text-lg h-12"
                          >
                            <span className="flex items-center">
                              <span className="mr-2 text-xl">{selectedCountry.flag}</span>
                              {selectedCountry.name}
                            </span>
                            <i className="fas fa-chevron-down ml-2 h-4 w-4 shrink-0 opacity-50"></i>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search countries..." 
                              value={countrySearch}
                              onValueChange={setCountrySearch}
                            />
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {filteredCountries
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((country) => (
                                <CommandItem
                                  key={country.code}
                                  value={country.name}
                                  onSelect={() => handleCountryChange(country)}
                                >
                                  <span className="mr-2 text-lg">{country.flag}</span>
                                  <span className="flex-1">{country.name}</span>
                                  <span className="text-sm text-gray-500">{country.phoneCode}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-region" className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-green-600" />
                        Region/City
                      </Label>
                      <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                        <SelectTrigger className="text-lg h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getRegionsByCountry(formData.country).map((region) => (
                            <SelectItem key={region} value={region}>
                              {region.charAt(0).toUpperCase() + region.slice(1).replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-language" className="flex items-center">
                        <Globe className="w-4 h-4 mr-2 text-green-600" />
                        Preferred Language
                      </Label>
                      <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={languageOpen}
                            className="w-full justify-between text-lg h-12"
                          >
                            {languages.find(lang => lang.code === formData.language)?.name || "Select language"}
                            <i className="fas fa-chevron-down ml-2 h-4 w-4 shrink-0 opacity-50"></i>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search languages..." 
                              value={languageSearch}
                              onValueChange={setLanguageSearch}
                            />
                            <CommandEmpty>No language found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {filteredLanguages
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((lang) => (
                                <CommandItem
                                  key={lang.code}
                                  value={lang.name}
                                  onSelect={() => handleLanguageChange(lang.code)}
                                >
                                  <span className="flex-1">{lang.name}</span>
                                  <span className="text-sm text-gray-500">{lang.nativeName}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Separator />

                  {/* Security Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-green-600" />
                      Security
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="flex items-center">
                        <Lock className="w-4 h-4 mr-2 text-green-600" />
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className={`text-lg pr-12 ${errors.password ? 'border-red-500' : ''}`}
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password" className="flex items-center">
                        <Lock className="w-4 h-4 mr-2 text-green-600" />
                        Confirm Password
                      </Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`text-lg ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        autoComplete="new-password"
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl font-semibold shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <UserPlus className="w-5 h-5" />
                        <span>Create Account</span>
                      </div>
                    )}
                  </Button>

                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>Email verification required:</strong> You'll receive a verification email after registration. Please verify your email before logging in.
                    </AlertDescription>
                  </Alert>
                </form>
              </TabsContent>

              {/* Reset Password Tab */}
              <TabsContent value="reset">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {!emailSent ? (
                    <>
                      {/* Reset Method Toggle */}
                      <div className="flex items-center justify-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <Button
                          type="button"
                          variant={loginMethod === 'email' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setLoginMethod('email')}
                          className="flex-1"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </Button>
                        <Button
                          type="button"
                          variant={loginMethod === 'phone' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setLoginMethod('phone')}
                          className="flex-1"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Phone
                        </Button>
                      </div>

                      {/* Email/Phone Input */}
                      {loginMethod === 'email' ? (
                        <div className="space-y-2">
                          <Label htmlFor="reset-email" className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-green-600" />
                            Email Address
                          </Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="Enter your email address"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`text-lg ${errors.email ? 'border-red-500' : ''}`}
                            autoComplete="email"
                          />
                          {errors.email && (
                            <p className="text-sm text-red-600 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.email}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="reset-phone" className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-green-600" />
                            Phone Number
                          </Label>
                          <div className="flex gap-2">
                            <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 rounded-md border min-w-[100px]">
                              <span className="text-lg mr-1">{selectedCountry.flag}</span>
                              <span className="text-sm font-medium">{selectedCountry.phoneCode}</span>
                            </div>
                            <Input
                              id="reset-phone"
                              type="tel"
                              placeholder="6XX XXX XXX"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              className={`text-lg flex-1 ${errors.phone ? 'border-red-500' : ''}`}
                              autoComplete="tel"
                            />
                          </div>
                          {errors.phone && (
                            <p className="text-sm text-red-600 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.phone}
                            </p>
                          )}
                        </div>
                      )}

                      <Button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg py-6 rounded-xl font-semibold shadow-lg"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Sending Reset Email...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <RotateCcw className="w-5 h-5" />
                            <span>Send Reset Email</span>
                          </div>
                        )}
                      </Button>

                      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800 dark:text-orange-200">
                          <strong>Password Reset:</strong> We'll send you an email with instructions to reset your password. The link will be valid for 1 hour.
                        </AlertDescription>
                      </Alert>
                    </>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                        Reset Email Sent!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Check your email for password reset instructions. The link will expire in 1 hour.
                      </p>
                      <Button 
                        onClick={() => {
                          setEmailSent(false);
                          setMode('login');
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Back to Login
                      </Button>
                    </div>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Language Selector */}
        <div className="text-center mt-6">
          <div className="inline-flex rounded-lg bg-white/20 backdrop-blur-sm p-1 shadow-lg">
            {(['en', 'fr', 'pid'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => changeLanguage(lang)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  language === lang 
                    ? 'bg-white text-gray-800 shadow-md' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'Pidgin'}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          <p>© 2025 AgroLink. Empowering farmers across Africa.</p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="#" className="hover:text-green-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-green-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-green-600 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { MarketPrice } from '../types';

export default function MarketView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedRegion, setSelectedRegion] = useState(user?.region || 'bamenda');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [priceFormData, setPriceFormData] = useState({
    crop: '',
    price: '',
    customCrop: ''
  });

  // Fetch market prices
  const { data: prices = [], isLoading: pricesLoading } = useQuery({
    queryKey: ['market-prices', selectedRegion],
    queryFn: () => ApiService.getMarketPrices(selectedRegion),
  });

  // Create market price mutation
  const createPriceMutation = useMutation({
    mutationFn: (data: { crop: string; price: number; unit?: string }) => 
      ApiService.createMarketPrice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-prices'] });
      setPriceFormData({ crop: '', price: '', customCrop: '' });
      setShowUpdateForm(false);
      toast({
        title: 'Price update submitted successfully!',
        description: user?.role === 'admin' ? 'Price has been published.' : 'Price update is pending admin verification.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to submit price update',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Verify market price mutation (admin only)
  const verifyPriceMutation = useMutation({
    mutationFn: (priceId: number) => ApiService.verifyMarketPrice(priceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-prices'] });
      toast({
        title: 'Price verified successfully!',
        description: 'The market price has been approved and is now live.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to verify price',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmitPrice = () => {
    const crop = priceFormData.crop === 'other' ? priceFormData.customCrop : priceFormData.crop;
    const price = parseInt(priceFormData.price);

    if (!crop || !price || price <= 0) {
      toast({
        title: t('fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    createPriceMutation.mutate({ crop, price });
  };

  const getCropIcon = (crop: string) => {
    const icons: Record<string, string> = {
      'maize': 'fas fa-seedling text-yellow-600',
      'cocoa': 'fas fa-cookie-bite text-amber-600',
      'yam': 'fas fa-carrot text-purple-600',
      'cassava': 'fas fa-leaf text-green-600',
      'plantain': 'fas fa-banana text-yellow-500',
      'tomato': 'fas fa-apple-alt text-red-600',
      'beans': 'fas fa-circle text-green-700',
      'groundnut': 'fas fa-circle text-orange-600'
    };
    return icons[crop.toLowerCase()] || 'fas fa-leaf text-green-600';
  };

  const getTrendIcon = (price: number, previousPrice?: number) => {
    if (!previousPrice) return <i className="fas fa-minus text-gray-600 text-xs mr-1"></i>;
    
    if (price > previousPrice) {
      return <i className="fas fa-arrow-up text-green-600 text-xs mr-1"></i>;
    } else if (price < previousPrice) {
      return <i className="fas fa-arrow-down text-red-600 text-xs mr-1"></i>;
    }
    return <i className="fas fa-minus text-gray-600 text-xs mr-1"></i>;
  };

  const getChangePercentage = (price: number, previousPrice?: number) => {
    if (!previousPrice) return '0%';
    const change = ((price - previousPrice) / previousPrice) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Market Header */}
      <div className="gradient-harvest rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          <i className="fas fa-chart-line mr-2"></i>
          {t('marketHeaderTitle')}
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100">{t('marketSubtitle')}</p>
            <p className="text-sm text-orange-100">{t('lastUpdated', { time: '2 hours ago' })}</p>
          </div>
          <div className="text-right">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white min-w-[120px]">
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
        </div>
      </div>

      {/* Price Cards */}
      <div className="grid gap-4">
        {pricesLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : prices.length === 0 ? (
          <Card className="card-farm text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                No prices available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Be the first to submit price updates for {selectedRegion}
              </p>
              <Button 
                onClick={() => setShowUpdateForm(true)}
                className="btn-harvest"
              >
                <i className="fas fa-plus mr-2"></i>
                Submit Price
              </Button>
            </CardContent>
          </Card>
        ) : (
          prices.map((price: MarketPrice) => (
            <Card key={price.id} className="card-farm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <i className={getCropIcon(price.crop)}></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white capitalize">
                        {price.crop}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{price.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {price.price.toLocaleString()} CFA
                    </div>
                    <div className="flex items-center text-sm">
                      {getTrendIcon(price.price)}
                      <span className={price.price > 0 ? 'text-green-600' : 'text-red-600'}>
                        {getChangePercentage(price.price)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Updated: {new Date(price.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      price.isVerified 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {price.isVerified ? 'Verified' : 'Pending'}
                    </span>
                    {user?.role === 'admin' && !price.isVerified && (
                      <Button
                        size="sm"
                        onClick={() => verifyPriceMutation.mutate(price.id)}
                        disabled={verifyPriceMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-6"
                      >
                        {verifyPriceMutation.isPending ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <i className="fas fa-check mr-1"></i>
                            Approve
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Submit Price Update */}
      <Card className="card-farm">
        <CardHeader>
          <CardTitle 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowUpdateForm(!showUpdateForm)}
          >
            <span className="flex items-center">
              <i className="fas fa-edit text-farm-green mr-2"></i>
              {t('updatePriceTitle')}
            </span>
            <i className={`fas fa-chevron-${showUpdateForm ? 'up' : 'down'} text-gray-400`}></i>
          </CardTitle>
        </CardHeader>
        
        {showUpdateForm && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="crop-type">{t('cropTypeLabel')}</Label>
                <Select value={priceFormData.crop} onValueChange={(value) => setPriceFormData(prev => ({ ...prev, crop: value }))}>
                  <SelectTrigger className="input-farm">
                    <SelectValue placeholder="Select crop..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maize">Maize</SelectItem>
                    <SelectItem value="cocoa">Cocoa</SelectItem>
                    <SelectItem value="yam">Yam</SelectItem>
                    <SelectItem value="cassava">Cassava</SelectItem>
                    <SelectItem value="plantain">Plantain</SelectItem>
                    <SelectItem value="tomato">Tomato</SelectItem>
                    <SelectItem value="beans">Beans</SelectItem>
                    <SelectItem value="groundnut">Groundnut</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="new-price">{t('newPriceLabel')}</Label>
                <Input
                  id="new-price"
                  type="number"
                  placeholder="250"
                  value={priceFormData.price}
                  onChange={(e) => setPriceFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="input-farm"
                />
              </div>
            </div>

            {priceFormData.crop === 'other' && (
              <div>
                <Label htmlFor="custom-crop">Custom Crop Name</Label>
                <Input
                  id="custom-crop"
                  type="text"
                  placeholder="Enter crop name"
                  value={priceFormData.customCrop}
                  onChange={(e) => setPriceFormData(prev => ({ ...prev, customCrop: e.target.value }))}
                  className="input-farm"
                />
              </div>
            )}
            
            <Button 
              onClick={handleSubmitPrice}
              disabled={createPriceMutation.isPending}
              className="w-full btn-farm"
            >
              {createPriceMutation.isPending ? (
                <div className="loading-spinner mr-2"></div>
              ) : (
                <i className="fas fa-paper-plane mr-2"></i>
              )}
              {t('submitUpdateText')}
            </Button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {t('verificationNote')}
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

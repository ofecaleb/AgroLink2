import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Tontine, TontinePayment } from '../types';

const createTontineSchema = z.object({
  name: z.string().min(3, 'Tontine name must be at least 3 characters'),
  monthlyContribution: z.number().min(1000, 'Minimum contribution is 1000 XAF')
});

const joinTontineSchema = z.object({
  inviteCode: z.string().min(6, 'Please enter a valid invite code')
});

const paymentSchema = z.object({
  amount: z.number().min(100, 'Minimum payment is 100 XAF'),
  paymentMethod: z.string().min(1, 'Please select a payment method')
});

export default function TontineView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTontine, setSelectedTontine] = useState<Tontine | null>(null);

  // Fetch user's tontines
  const { data: tontines = [], isLoading } = useQuery({
    queryKey: ['/api/tontines'],
    queryFn: () => ApiService.getTontines(),
  });

  // Create tontine form
  const createForm = useForm({
    resolver: zodResolver(createTontineSchema),
    defaultValues: {
      name: '',
      monthlyContribution: 5000
    }
  });

  // Join tontine form  
  const joinForm = useForm({
    resolver: zodResolver(joinTontineSchema),
    defaultValues: {
      inviteCode: ''
    }
  });

  // Payment form
  const paymentForm = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: ''
    }
  });

  // Create tontine mutation
  const createTontineMutation = useMutation({
    mutationFn: (data: { name: string; monthlyContribution: number }) => 
      ApiService.createTontine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tontines'] });
      setShowCreateModal(false);
      createForm.reset();
      toast({
        title: 'Success',
        description: 'Tontine created successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create tontine',
        variant: 'destructive',
      });
    }
  });

  // Join tontine mutation
  const joinTontineMutation = useMutation({
    mutationFn: (inviteCode: string) => ApiService.joinTontineByCode(inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tontines'] });
      setShowJoinModal(false);
      joinForm.reset();
      toast({
        title: 'Success',
        description: 'Successfully joined tontine!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join tontine',
        variant: 'destructive',
      });
    }
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data: { tontineId: number; amount: number; paymentMethod: string }) =>
      ApiService.createTontinePayment(data.tontineId, {
        amount: data.amount,
        paymentMethod: data.paymentMethod
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tontines'] });
      setShowPaymentModal(false);
      setSelectedTontine(null);
      paymentForm.reset();
      toast({
        title: 'Success',
        description: 'Payment submitted successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Payment failed',
        variant: 'destructive',
      });
    }
  });

  // Create invite mutation
  const createInviteMutation = useMutation({
    mutationFn: (tontineId: number) => ApiService.createTontineInvite(tontineId, {}),
    onSuccess: (invite) => {
      navigator.clipboard.writeText(invite.inviteCode);
      toast({
        title: 'Invite Created',
        description: `Invite code ${invite.inviteCode} copied to clipboard!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invite',
        variant: 'destructive',
      });
    }
  });

  const handleCreateTontine = (data: { name: string; monthlyContribution: number }) => {
    createTontineMutation.mutate(data);
  };

  const handleJoinTontine = (data: { inviteCode: string }) => {
    joinTontineMutation.mutate(data.inviteCode);
  };

  const handleMakePayment = (data: { amount: number; paymentMethod: string }) => {
    if (selectedTontine) {
      createPaymentMutation.mutate({
        tontineId: selectedTontine.id,
        amount: data.amount,
        paymentMethod: data.paymentMethod
      });
    }
  };

  const handleCreateInvite = (tontineId: number) => {
    createInviteMutation.mutate(tontineId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Tontines
        </h1>
        <div className="flex space-x-3">
          <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <i className="fas fa-users mr-2"></i>
                Join Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Tontine Group</DialogTitle>
              </DialogHeader>
              <Form {...joinForm}>
                <form onSubmit={joinForm.handleSubmit(handleJoinTontine)} className="space-y-4">
                  <FormField
                    control={joinForm.control}
                    name="inviteCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invite Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter invite code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={joinTontineMutation.isPending}
                  >
                    {joinTontineMutation.isPending ? 'Joining...' : 'Join Tontine'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <i className="fas fa-plus mr-2"></i>
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tontine</DialogTitle>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateTontine)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tontine Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Farmers Savings Group" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="monthlyContribution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Contribution (XAF)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="5000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createTontineMutation.isPending}
                  >
                    {createTontineMutation.isPending ? 'Creating...' : 'Create Tontine'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tontines List */}
      {tontines.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <i className="fas fa-users text-gray-400 text-4xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Tontines Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first tontine group or join an existing one to get started.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={() => setShowCreateModal(true)}>
                Create Group
              </Button>
              <Button variant="outline" onClick={() => setShowJoinModal(true)}>
                Join Group
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tontines.map((tontine: Tontine) => (
            <Card key={tontine.id} className="border-l-4 border-l-farm-green">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{tontine.name}</span>
                  <Badge variant="outline">
                    {tontine.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Monthly</p>
                    <p className="font-semibold">{tontine.monthlyContribution.toLocaleString()} XAF</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Members</p>
                    <p className="font-semibold">{tontine.memberCount || 1}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Fund</p>
                    <p className="font-semibold">{((tontine.memberCount || 1) * tontine.monthlyContribution).toLocaleString()} XAF</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Next Payout</p>
                    <p className="font-semibold text-green-600">Position {(tontine.currentPosition || 0) + 1}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedTontine(tontine);
                      paymentForm.setValue('amount', tontine.monthlyContribution);
                      setShowPaymentModal(true);
                    }}
                  >
                    <i className="fas fa-credit-card mr-1"></i>
                    Pay
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleCreateInvite(tontine.id)}
                    disabled={createInviteMutation.isPending}
                  >
                    <i className="fas fa-share mr-1"></i>
                    Invite
                  </Button>
                </div>

                {tontine.isLeader && (
                  <Alert>
                    <i className="fas fa-crown h-4 w-4"></i>
                    <AlertDescription>
                      You are the group leader
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
          </DialogHeader>
          {selectedTontine && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-medium">{selectedTontine.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monthly Contribution: {selectedTontine.monthlyContribution.toLocaleString()} XAF
                </p>
              </div>
              
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(handleMakePayment)} className="space-y-4">
                  <FormField
                    control={paymentForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (XAF)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
                            <SelectItem value="orange_money">Orange Money</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Amount:</span>
                      <span>{paymentForm.watch('amount')?.toLocaleString() || 0} XAF</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Platform Fee (2%):</span>
                      <span>{Math.round((paymentForm.watch('amount') || 0) * 0.02).toLocaleString()} XAF</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                      <span>Total:</span>
                      <span>{Math.round((paymentForm.watch('amount') || 0) * 1.02).toLocaleString()} XAF</span>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createPaymentMutation.isPending}
                  >
                    {createPaymentMutation.isPending ? 'Processing...' : 'Make Payment'}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
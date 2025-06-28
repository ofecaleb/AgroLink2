import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ApiService } from '../lib/api';
import type { SupportTicket } from '../types';

export default function HelpSupport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketData, setTicketData] = useState({
    subject: '',
    message: '',
    category: 'technical',
    priority: 'medium'
  });

  // Fetch user's support tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/support/tickets'],
    queryFn: () => ApiService.getSupportTickets(),
  });

  // Create support ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: (data: any) => ApiService.createSupportTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      setTicketData({ subject: '', message: '', category: 'technical', priority: 'medium' });
      setShowNewTicket(false);
      toast({
        title: 'Support ticket created successfully!',
        description: 'Our team will respond to your request soon.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create support ticket',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setTicketData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitTicket = () => {
    if (!ticketData.subject || !ticketData.message) {
      toast({
        title: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    createTicketMutation.mutate(ticketData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="gradient-farm rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          <i className="fas fa-life-ring mr-2"></i>
          Help & Support
        </h2>
        <p className="text-orange-100">
          Get help with AgroLink or report issues to our support team
        </p>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          {/* New Ticket Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Support Tickets</h3>
            <Button 
              onClick={() => setShowNewTicket(!showNewTicket)}
              className="bg-farm-green hover:bg-farm-green/90"
            >
              <i className="fas fa-plus mr-2"></i>
              New Ticket
            </Button>
          </div>

          {/* New Ticket Form */}
          {showNewTicket && (
            <Card>
              <CardHeader>
                <CardTitle>Create Support Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={ticketData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className="input-farm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="feature_request">Feature Request</SelectItem>
                        <SelectItem value="bug_report">Bug Report</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={ticketData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                      <SelectTrigger className="input-farm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Brief description of the issue"
                    value={ticketData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="input-farm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Please describe your issue in detail..."
                    value={ticketData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className="input-farm min-h-[120px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setShowNewTicket(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitTicket}
                    disabled={createTicketMutation.isPending}
                    className="bg-farm-green hover:bg-farm-green/90"
                  >
                    {createTicketMutation.isPending ? (
                      <div className="loading-spinner mr-2"></div>
                    ) : (
                      <i className="fas fa-paper-plane mr-2"></i>
                    )}
                    Submit Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tickets List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p>Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-ticket-alt text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    No Support Tickets
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You haven't created any support tickets yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket: SupportTicket) => (
                <Card key={ticket.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                          {ticket.subject}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {ticket.category.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          #{ticket.id}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {ticket.message}
                    </p>

                    {ticket.adminResponse && (
                      <>
                        <Separator className="my-4" />
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            <i className="fas fa-reply mr-2"></i>
                            Admin Response
                          </h5>
                          <p className="text-blue-700 dark:text-blue-300">
                            {ticket.adminResponse}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-l-4 border-farm-green pl-4">
                  <h4 className="font-semibold mb-2">How do I create a tontine group?</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Go to the Tontine tab, click "Create New Tontine", enter the group name and monthly contribution amount, then share the invite code with members.
                  </p>
                </div>

                <div className="border-l-4 border-farm-green pl-4">
                  <h4 className="font-semibold mb-2">How do I submit market prices?</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Navigate to the Market tab, click "Submit Price", enter the crop name and current price. Admin verification is required before prices go live.
                  </p>
                </div>

                <div className="border-l-4 border-farm-green pl-4">
                  <h4 className="font-semibold mb-2">What payment methods are supported?</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    We support MTN Mobile Money and Orange Money for tontine contributions and other payments.
                  </p>
                </div>

                <div className="border-l-4 border-farm-green pl-4">
                  <h4 className="font-semibold mb-2">How do I upgrade to premium?</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Premium features include advanced weather forecasts, priority support, and enhanced market analytics. Contact support for upgrade options.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-farm-green rounded-full flex items-center justify-center">
                    <i className="fas fa-envelope text-white"></i>
                  </div>
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">support@agrolink.cm</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-farm-green rounded-full flex items-center justify-center">
                    <i className="fas fa-phone text-white"></i>
                  </div>
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">+237 6XX XXX XXX</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-farm-green rounded-full flex items-center justify-center">
                    <i className="fas fa-clock text-white"></i>
                  </div>
                  <div>
                    <p className="font-medium">Support Hours</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mon-Fri: 8AM-6PM WAT</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Critical Issues
                  </h4>
                  <p className="text-red-700 dark:text-red-300 text-sm mb-2">
                    For critical issues affecting payments or account security
                  </p>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    WhatsApp: +237 6XX XXX XXX
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    <i className="fas fa-comments mr-2"></i>
                    Community
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Join our community forum for discussions and peer support
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
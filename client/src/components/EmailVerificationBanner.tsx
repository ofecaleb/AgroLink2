import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, X, RefreshCw } from 'lucide-react';

export default function EmailVerificationBanner() {
  const { user, isEmailVerified, resendVerificationEmail } = useAuth();
  const { toast } = useToast();
  const [isHidden, setIsHidden] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!user || isEmailVerified || isHidden) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    
    try {
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
          description: 'Check your email for the verification link.',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to Resend',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 mb-4">
      <Mail className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <strong>Email Verification Required:</strong> Please verify your email address to access all features.
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResendVerification}
              disabled={isResending}
              className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
            >
              {isResending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                'Resend Email'
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsHidden(true)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
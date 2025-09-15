import { toast } from '@/hooks/use-toast';

export interface NotificationOptions {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class NotificationService {
  static show(options: NotificationOptions) {
    const { title, description, type = 'info', duration = 5000, action } = options;

    toast({
      title,
      description,
      variant: type === 'error' ? 'destructive' : 'default',
      duration,
      action: action ? {
        altText: action.label,
        onClick: action.onClick,
        children: action.label
      } : undefined
    });
  }

  static success(title: string, description?: string) {
    this.show({ title, description, type: 'success' });
  }

  static error(title: string, description?: string) {
    this.show({ title, description, type: 'error' });
  }

  static warning(title: string, description?: string) {
    this.show({ title, description, type: 'warning' });
  }

  static info(title: string, description?: string) {
    this.show({ title, description, type: 'info' });
  }

  // Authentication specific notifications
  static authSuccess(message: string) {
    this.success('Authentication Successful', message);
  }

  static authError(message: string) {
    this.error('Authentication Failed', message);
  }

  static emailVerificationSent() {
    this.success(
      'Verification Email Sent!', 
      'Please check your email and click the verification link to complete your account setup.'
    );
  }

  static passwordResetSent() {
    this.success(
      'Password Reset Email Sent!', 
      'Check your email for instructions to reset your password. The link will expire in 1 hour.'
    );
  }

  static accountCreated() {
    this.success(
      'Account Created Successfully!', 
      'Welcome to AgroLink! Please verify your email to access all features.'
    );
  }

  static profileUpdated() {
    this.success(
      'Profile Updated', 
      'Your profile information has been saved successfully.'
    );
  }

  static passwordChanged() {
    this.success(
      'Password Changed', 
      'Your password has been updated successfully.'
    );
  }

  // Tontine notifications
  static tontineCreated(name: string) {
    this.success(
      'Tontine Created!', 
      `Your tontine group "${name}" has been created and is pending approval.`
    );
  }

  static tontineJoined(name: string) {
    this.success(
      'Joined Tontine!', 
      `You have successfully joined "${name}". Welcome to the group!`
    );
  }

  static paymentSuccessful(amount: number, currency: string) {
    this.success(
      'Payment Successful!', 
      `Your contribution of ${amount.toLocaleString()} ${currency} has been recorded.`
    );
  }

  // Market notifications
  static priceSubmitted() {
    this.success(
      'Price Submitted!', 
      'Your market price update has been submitted for verification.'
    );
  }

  static priceVerified() {
    this.success(
      'Price Verified!', 
      'The market price has been verified and is now live.'
    );
  }

  // Community notifications
  static postCreated() {
    this.success(
      'Post Shared!', 
      'Your post has been shared with the community.'
    );
  }

  static commentAdded() {
    this.success(
      'Comment Added!', 
      'Your comment has been added to the post.'
    );
  }

  // Error notifications
  static networkError() {
    this.error(
      'Network Error', 
      'Please check your internet connection and try again.'
    );
  }

  static serverError() {
    this.error(
      'Server Error', 
      'Something went wrong on our end. Please try again later.'
    );
  }

  static validationError(message: string) {
    this.error(
      'Validation Error', 
      message
    );
  }

  static permissionError() {
    this.error(
      'Permission Denied', 
      'You do not have permission to perform this action.'
    );
  }

  // Session notifications
  static sessionExpired() {
    this.warning(
      'Session Expired', 
      'Your session has expired. Please log in again to continue.'
    );
  }

  static sessionExtended() {
    this.info(
      'Session Extended', 
      'Your session has been automatically extended due to activity.'
    );
  }

  // Offline notifications
  static goingOffline() {
    this.warning(
      'Connection Lost', 
      'You are now offline. Some features may be limited.'
    );
  }

  static backOnline() {
    this.success(
      'Connection Restored', 
      'You are back online. All features are now available.'
    );
  }

  // Feature notifications
  static featureComingSoon(feature: string) {
    this.info(
      'Coming Soon!', 
      `${feature} is currently in development and will be available soon.`
    );
  }

  static premiumFeatureRequired() {
    this.warning(
      'Premium Feature', 
      'This feature requires a premium subscription. Upgrade your account to access it.'
    );
  }

  // Support notifications
  static supportTicketCreated() {
    this.success(
      'Support Ticket Created!', 
      'Your support request has been submitted. We\'ll get back to you within 24 hours.'
    );
  }

  static supportTicketUpdated() {
    this.info(
      'Ticket Updated', 
      'Your support ticket has been updated. Check your email for details.'
    );
  }
}

// Export singleton instance
export const notifications = NotificationService;
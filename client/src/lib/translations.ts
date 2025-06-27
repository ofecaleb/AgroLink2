import type { Language } from '../types';

export const translations = {
  en: {
    // Header
    headerTitle: 'AgroLink',
    online: 'Online',
    offline: 'Offline',
    offlineMessage: 'Offline - Using cached data',
    
    // Authentication
    welcomeTitle: 'Welcome to AgroLink',
    welcomeSubtitle: 'Empowering farmers through community finance',
    phoneLabel: 'Phone Number',
    pinLabel: '4-Digit PIN',
    nameLabel: 'Full Name',
    regionLabel: 'Region',
    createPinLabel: 'Create 4-Digit PIN',
    loginBtn: 'Login',
    registerBtn: 'Create Account',
    backToLoginBtn: 'Back to Login',
    createAccountBtn: 'Create Account',
    forgotPin: 'Forgot PIN?',
    
    // Dashboard
    welcomeMessage: 'Welcome, {name}!',
    dashboardSubtitle: 'Your farming community awaits',
    balance: 'Balance',
    quickTontine: 'My Tontine',
    quickPrices: 'Market Prices',
    weatherTitle: 'Weather Today',
    recentActivityTitle: 'Recent Activity',
    
    // Tontine
    tontineTitle: 'My Tontine',
    monthlyContribution: 'Monthly Contribution',
    nextPayout: 'Next Payout',
    groupProgress: 'Group Progress',
    contributeTitle: 'Make Contribution',
    amountLabel: 'Amount (CFA)',
    feeBreakdownTitle: 'Fee Breakdown',
    contribution: 'Contribution:',
    platformFee: 'Platform Fee (2%):',
    total: 'Total:',
    momoPayText: 'Pay with MTN Mobile Money',
    orangePayText: 'Pay with Orange Money',
    groupMembersTitle: 'Group Members',
    joinNewText: 'Join New Tontine',
    
    // Market
    marketHeaderTitle: 'Market Prices',
    marketSubtitle: 'Latest crop prices in your region',
    lastUpdated: 'Last updated: {time}',
    premiumFeaturesTitle: 'Premium Features',
    premiumDescription: 'Get price predictions, alerts, and historical data',
    upgradeText: 'Upgrade',
    updatePriceTitle: 'Update Market Price',
    cropTypeLabel: 'Crop Type',
    newPriceLabel: 'New Price (CFA/kg)',
    submitUpdateText: 'Submit Update',
    verificationNote: 'Price updates require admin verification before publication',
    
    // Weather
    currentWeatherLocation: '{location}',
    forecastTitle: '5-Day Forecast',
    farmingAlertsTitle: 'Farming Alerts',
    humidity: 'Humidity',
    wind: 'Wind',
    visibility: 'Visibility',
    feelsLike: 'Feels Like',
    
    // Community
    communityHeaderTitle: 'Community Feed',
    communitySubtitle: 'Connect with farmers in your region',
    createPostTitle: 'Share with Community',
    postBtnText: 'Post',
    postPlaceholder: 'Share your farming experience, ask questions, or help fellow farmers...',
    
    // Navigation
    dashboard: 'Dashboard',
    tontine: 'Tontine',
    prices: 'Prices',
    weather: 'Weather',
    community: 'Community',
    
    // Menu
    language: 'Language',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    premiumFeatures: 'Premium Features',
    helpSupport: 'Help & Support',
    logout: 'Logout',
    
    // Modals
    selectLanguageTitle: 'Select Language',
    joinTontineTitle: 'Join Tontine Group',
    groupNameLabel: 'Group Name',
    monthlyAmountLabel: 'Monthly Contribution (CFA)',
    groupCodeLabel: 'Group Code (Optional)',
    importantInfoTitle: 'Important Information',
    cancel: 'Cancel',
    confirm: 'Confirm',
    cancelJoin: 'Cancel',
    confirmJoin: 'Join Group',
    
    // Notifications
    loginSuccess: 'Login successful!',
    registrationSuccess: 'Account created successfully! Please login.',
    languageUpdated: 'Language updated successfully!',
    sessionExpired: 'Session expired. Please login again.',
    paymentSuccess: 'Payment successful! Contribution added to tontine.',
    paymentProcessing: 'Redirecting to MTN Mobile Money...',
    
    // Tour
    tourWelcomeTitle: 'Welcome to AgroLink!',
    tourWelcomeText: 'Your digital farming companion for community finance, market prices, and weather updates.',
    skipTour: 'Skip',
    nextTour: 'Next',
    
    // Errors
    invalidCredentials: 'Invalid phone number or PIN',
    userExists: 'User already exists with this phone number',
    fillAllFields: 'Please fill in all required fields',
    pinLength: 'PIN must be exactly 4 digits',
    connectionError: 'Connection error. Please try again.',
    sessionInvalid: 'Session expired. Please login again.',
    
    // Validation
    phoneRequired: 'Phone number is required',
    pinRequired: 'PIN is required',
    nameRequired: 'Name is required',
    phoneMinLength: 'Phone number must be at least 10 digits',
    pinValidation: 'PIN must be 4 digits'
  },
  
  fr: {
    // Header
    headerTitle: 'AgroLink',
    online: 'En ligne',
    offline: 'Hors ligne',
    offlineMessage: 'Hors ligne - Utilisation des données mises en cache',
    
    // Authentication
    welcomeTitle: 'Bienvenue sur AgroLink',
    welcomeSubtitle: 'Autonomiser les agriculteurs grâce au financement communautaire',
    phoneLabel: 'Numéro de téléphone',
    pinLabel: 'PIN à 4 chiffres',
    nameLabel: 'Nom complet',
    regionLabel: 'Région',
    createPinLabel: 'Créer un PIN à 4 chiffres',
    loginBtn: 'Connexion',
    registerBtn: 'Créer un compte',
    backToLoginBtn: 'Retour à la connexion',
    createAccountBtn: 'Créer un compte',
    forgotPin: 'PIN oublié?',
    
    // Dashboard
    welcomeMessage: 'Bienvenue, {name}!',
    dashboardSubtitle: 'Votre communauté agricole vous attend',
    balance: 'Solde',
    quickTontine: 'Ma Tontine',
    quickPrices: 'Prix du marché',
    weatherTitle: 'Météo aujourd\'hui',
    recentActivityTitle: 'Activité récente',
    
    // Tontine
    tontineTitle: 'Ma Tontine',
    monthlyContribution: 'Contribution mensuelle',
    nextPayout: 'Prochain paiement',
    groupProgress: 'Progrès du groupe',
    contributeTitle: 'Faire une contribution',
    amountLabel: 'Montant (CFA)',
    feeBreakdownTitle: 'Répartition des frais',
    contribution: 'Contribution:',
    platformFee: 'Frais de plateforme (2%):',
    total: 'Total:',
    momoPayText: 'Payer avec MTN Mobile Money',
    orangePayText: 'Payer avec Orange Money',
    groupMembersTitle: 'Membres du groupe',
    joinNewText: 'Rejoindre une nouvelle tontine',
    
    // Market
    marketHeaderTitle: 'Prix du marché',
    marketSubtitle: 'Derniers prix des cultures dans votre région',
    lastUpdated: 'Dernière mise à jour: {time}',
    premiumFeaturesTitle: 'Fonctionnalités premium',
    premiumDescription: 'Obtenez des prédictions de prix, des alertes et des données historiques',
    upgradeText: 'Mettre à niveau',
    updatePriceTitle: 'Mettre à jour le prix du marché',
    cropTypeLabel: 'Type de culture',
    newPriceLabel: 'Nouveau prix (CFA/kg)',
    submitUpdateText: 'Soumettre la mise à jour',
    verificationNote: 'Les mises à jour de prix nécessitent une vérification administrateur avant publication',
    
    // Weather
    currentWeatherLocation: '{location}',
    forecastTitle: 'Prévisions sur 5 jours',
    farmingAlertsTitle: 'Alertes agricoles',
    humidity: 'Humidité',
    wind: 'Vent',
    visibility: 'Visibilité',
    feelsLike: 'Ressenti',
    
    // Community
    communityHeaderTitle: 'Fil communautaire',
    communitySubtitle: 'Connectez-vous avec les agriculteurs de votre région',
    createPostTitle: 'Partager avec la communauté',
    postBtnText: 'Publier',
    postPlaceholder: 'Partagez votre expérience agricole, posez des questions ou aidez d\'autres agriculteurs...',
    
    // Navigation
    dashboard: 'Tableau de bord',
    tontine: 'Tontine',
    prices: 'Prix',
    weather: 'Météo',
    community: 'Communauté',
    
    // Menu
    language: 'Langue',
    darkMode: 'Mode sombre',
    lightMode: 'Mode clair',
    premiumFeatures: 'Fonctionnalités premium',
    helpSupport: 'Aide et support',
    logout: 'Déconnexion',
    
    // Modals
    selectLanguageTitle: 'Sélectionner la langue',
    joinTontineTitle: 'Rejoindre un groupe tontine',
    groupNameLabel: 'Nom du groupe',
    monthlyAmountLabel: 'Contribution mensuelle (CFA)',
    groupCodeLabel: 'Code du groupe (optionnel)',
    importantInfoTitle: 'Informations importantes',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    cancelJoin: 'Annuler',
    confirmJoin: 'Rejoindre le groupe',
    
    // Notifications
    loginSuccess: 'Connexion réussie!',
    registrationSuccess: 'Compte créé avec succès! Veuillez vous connecter.',
    languageUpdated: 'Langue mise à jour avec succès!',
    sessionExpired: 'Session expirée. Veuillez vous reconnecter.',
    paymentSuccess: 'Paiement réussi! Contribution ajoutée à la tontine.',
    paymentProcessing: 'Redirection vers MTN Mobile Money...',
    
    // Tour
    tourWelcomeTitle: 'Bienvenue sur AgroLink!',
    tourWelcomeText: 'Votre compagnon agricole numérique pour le financement communautaire, les prix du marché et les mises à jour météo.',
    skipTour: 'Ignorer',
    nextTour: 'Suivant',
    
    // Errors
    invalidCredentials: 'Numéro de téléphone ou PIN invalide',
    userExists: 'Un utilisateur existe déjà avec ce numéro de téléphone',
    fillAllFields: 'Veuillez remplir tous les champs requis',
    pinLength: 'Le PIN doit comporter exactement 4 chiffres',
    connectionError: 'Erreur de connexion. Veuillez réessayer.',
    sessionInvalid: 'Session expirée. Veuillez vous reconnecter.',
    
    // Validation
    phoneRequired: 'Le numéro de téléphone est requis',
    pinRequired: 'Le PIN est requis',
    nameRequired: 'Le nom est requis',
    phoneMinLength: 'Le numéro de téléphone doit comporter au moins 10 chiffres',
    pinValidation: 'Le PIN doit comporter 4 chiffres'
  },
  
  pid: {
    // Header
    headerTitle: 'AgroLink',
    online: 'Online',
    offline: 'Offline',
    offlineMessage: 'Offline - We dey use cached data',
    
    // Authentication
    welcomeTitle: 'Welcome to AgroLink',
    welcomeSubtitle: 'We dey help farmers with community money',
    phoneLabel: 'Phone Number',
    pinLabel: '4-Digit PIN',
    nameLabel: 'Your Full Name',
    regionLabel: 'Your Region',
    createPinLabel: 'Make 4-Digit PIN',
    loginBtn: 'Login',
    registerBtn: 'Make Account',
    backToLoginBtn: 'Go Back to Login',
    createAccountBtn: 'Make Account',
    forgotPin: 'Forget PIN?',
    
    // Dashboard
    welcomeMessage: 'Welcome, {name}!',
    dashboardSubtitle: 'Your farmer people dey wait for you',
    balance: 'Your Money',
    quickTontine: 'My Tontine',
    quickPrices: 'Market Price',
    weatherTitle: 'Weather Today',
    recentActivityTitle: 'Wetin Don Happen',
    
    // Tontine
    tontineTitle: 'My Tontine',
    monthlyContribution: 'Monthly Contribution',
    nextPayout: 'Next Payout',
    groupProgress: 'Group Progress',
    contributeTitle: 'Add Money',
    amountLabel: 'How Much (CFA)',
    feeBreakdownTitle: 'Fee Breakdown',
    contribution: 'Contribution:',
    platformFee: 'Platform Fee (2%):',
    total: 'Total:',
    momoPayText: 'Pay with MTN MoMo',
    orangePayText: 'Pay with Orange Money',
    groupMembersTitle: 'Group Members',
    joinNewText: 'Join New Tontine',
    
    // Market
    marketHeaderTitle: 'Market Price Dem',
    marketSubtitle: 'Latest crop price for your area',
    lastUpdated: 'Last update: {time}',
    premiumFeaturesTitle: 'Premium Features',
    premiumDescription: 'Get price predictions, alerts and historical data',
    upgradeText: 'Upgrade',
    updatePriceTitle: 'Update Market Price',
    cropTypeLabel: 'Crop Type',
    newPriceLabel: 'New Price (CFA/kg)',
    submitUpdateText: 'Submit Update',
    verificationNote: 'Price updates need admin verification before publication',
    
    // Weather
    currentWeatherLocation: '{location}',
    forecastTitle: '5-Day Weather',
    farmingAlertsTitle: 'Farming Alerts',
    humidity: 'Humidity',
    wind: 'Wind',
    visibility: 'Visibility',
    feelsLike: 'Feels Like',
    
    // Community
    communityHeaderTitle: 'Community Talk',
    communitySubtitle: 'Connect with farmers for your area',
    createPostTitle: 'Share with Community',
    postBtnText: 'Post',
    postPlaceholder: 'Share your farming experience, ask questions or help fellow farmers...',
    
    // Navigation
    dashboard: 'Home',
    tontine: 'Tontine',
    prices: 'Prices',
    weather: 'Weather',
    community: 'Community',
    
    // Menu
    language: 'Language',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    premiumFeatures: 'Premium Features',
    helpSupport: 'Help & Support',
    logout: 'Logout',
    
    // Modals
    selectLanguageTitle: 'Choose Language',
    joinTontineTitle: 'Join Tontine Group',
    groupNameLabel: 'Group Name',
    monthlyAmountLabel: 'Monthly Contribution (CFA)',
    groupCodeLabel: 'Group Code (Optional)',
    importantInfoTitle: 'Important Info',
    cancel: 'Cancel',
    confirm: 'Confirm',
    cancelJoin: 'Cancel',
    confirmJoin: 'Join Group',
    
    // Notifications
    loginSuccess: 'Login successful!',
    registrationSuccess: 'Account created successfully! Please login.',
    languageUpdated: 'Language updated successfully!',
    sessionExpired: 'Session expired. Please login again.',
    paymentSuccess: 'Payment successful! Contribution added to tontine.',
    paymentProcessing: 'Redirecting to MTN Mobile Money...',
    
    // Tour
    tourWelcomeTitle: 'Welcome to AgroLink!',
    tourWelcomeText: 'Your digital farming companion for community finance, market prices and weather updates.',
    skipTour: 'Skip',
    nextTour: 'Next',
    
    // Errors
    invalidCredentials: 'Wrong phone number or PIN',
    userExists: 'User already exists with this phone number',
    fillAllFields: 'Please fill all required fields',
    pinLength: 'PIN must be exactly 4 digits',
    connectionError: 'Connection error. Please try again.',
    sessionInvalid: 'Session expired. Please login again.',
    
    // Validation
    phoneRequired: 'Phone number is required',
    pinRequired: 'PIN is required',
    nameRequired: 'Name is required',
    phoneMinLength: 'Phone number must be at least 10 digits',
    pinValidation: 'PIN must be 4 digits'
  }
};

export function getTranslation(language: Language, key: string, params?: Record<string, string>): string {
  const trans = translations[language] || translations.en;
  let text = (trans as any)[key] || key;
  
  // Replace parameters in the text
  if (params) {
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
  }
  
  return text;
}

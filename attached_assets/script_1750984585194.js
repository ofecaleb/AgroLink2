// JavaScript: Robust logic for AgroLink
// Translations
const translations = {
    en: {
        headerTitle: 'AgroLink',
        authTitle: 'Login',
        authLoginBtn: 'Login',
        authSignupBtn: 'Sign Up',
        forgotPinLink: 'Forgot PIN?',
        forgotSubmitBtn: 'Reset PIN',
        backToLogin: 'Back to Login',
        welcomeText: 'Welcome, Farmer!',
        dashboardInfo: 'Join a tontine, check crop prices, or see weather updates.',
        tontineTitle: 'My Tontine',
        tontineGroup: 'Group: None',
        tontineContribution: 'Contribution: 0 CFA',
        tontinePayout: 'Next Payout: N/A',
        tontineMembers: 'Members: None',
        tontineLeader: 'Leader: None',
        tontineFee: 'Transaction Fee: 2%',
        joinTontineBtn: 'Join Tontine',
        marketTitle: 'Market Prices',
        weatherTitle: 'Weather Update',
        communityTitle: 'Community Feed',
        infoTitle: 'Info',
        menuLanguage: 'Language',
        menuTheme: 'Dark Mode',
        menuColor: 'Color Scheme',
        menuInfo: 'Info',
        menuLogout: 'Logout',
        notification: 'Action completed!',
        premiumFeature: 'Upgrade to Premium to access this feature.',
        tourTitle: 'Welcome to AgroLink!',
        tourText: ['Tap the menu to change language or theme.', 'Use tabs to check tontine, prices, or weather.', 'Join a tontine to save with friends!'],
        tabDashboard: 'Dashboard',
        tabTontine: 'Tontine',
        tabMarket: 'Prices',
        tabWeather: 'Weather',
        tabCommunity: 'Feed'
    },
    fr: {
        headerTitle: 'AgroLink',
        authTitle: 'Connexion',
        authLoginBtn: 'Connexion',
        authSignupBtn: 'Inscription',
        forgotPinLink: 'PIN oublié ?',
        forgotSubmitBtn: 'Réinitialiser PIN',
        backToLogin: 'Retour à la connexion',
        welcomeText: 'Bienvenue, Agriculteur !',
        dashboardInfo: 'Rejoignez une tontine, vérifiez les prix des cultures ou consultez la météo.',
        tontineTitle: 'Ma Tontine',
        tontineGroup: 'Groupe : Aucun',
        tontineContribution: 'Contribution : 0 CFA',
        tontinePayout: 'Prochain Paiement : N/A',
        tontineMembers: 'Membres : Aucun',
        tontineLeader: 'Leader : Aucun',
        tontineFee: 'Frais de Transaction : 2%',
        joinTontineBtn: 'Rejoindre Tontine',
        marketTitle: 'Prix du Marché',
        weatherTitle: 'Météo',
        communityTitle: 'Fil de la Communauté',
        infoTitle: 'Info',
        menuLanguage: 'Langue',
        menuTheme: 'Mode Sombre',
        menuColor: 'Schéma de Couleurs',
        menuInfo: 'Info',
        menuLogout: 'Déconnexion',
        notification: 'Action terminée !',
        premiumFeature: 'Passez à Premium pour accéder à cette fonctionnalité.',
        tourTitle: 'Bienvenue sur AgroLink !',
        tourText: ['Touchez le menu pour changer de langue ou de thème.', 'Utilisez les onglets pour vérifier tontine, prix ou météo.', 'Rejoignez une tontine pour économiser avec des amis !'],
        tabDashboard: 'Tableau de bord',
        tabTontine: 'Tontine',
        tabMarket: 'Prix',
        tabWeather: 'Météo',
        tabCommunity: 'Fil'
    },
    pid: {
        headerTitle: 'AgroLink',
        authTitle: 'Login',
        authLoginBtn: 'Login',
        authSignupBtn: 'Sign Up',
        forgotPinLink: 'Forget PIN?',
        forgotSubmitBtn: 'Reset PIN',
        backToLogin: 'Go Back to Login',
        welcomeText: 'Welcome, Farmer Man!',
        dashboardInfo: 'Join tontine, check crop price, or see weather oh.',
        tontineTitle: 'My Tontine',
        tontineGroup: 'Group: None',
        tontineContribution: 'Contribution: 0 CFA',
        tontinePayout: 'Next Payout: N/A',
        tontineMembers: 'Members: None',
        tontineLeader: 'Leader: None',
        tontineFee: 'Transaction Fee: 2%',
        joinTontineBtn: 'Join Tontine',
        marketTitle: 'Market Price Dem',
        weatherTitle: 'Weather Talk',
        communityTitle: 'Community Talk',
        infoTitle: 'Info',
        menuLanguage: 'Language',
        menuTheme: 'Dark Mode',
        menuColor: 'Color Scheme',
        menuInfo: 'Info',
        menuLogout: 'Logout',
        notification: 'Work don finish!',
        premiumFeature: 'Pay for Premium to use dis feature oh.',
        tourTitle: 'Welcome to AgroLink!',
        tourText: ['Tap menu for change language or color.', 'Use tabs for tontine, price, or weather oh.', 'Join tontine to save wit friends!'],
        tabDashboard: 'Dashboard',
        tabTontine: 'Tontine',
        tabMarket: 'Prices',
        tabWeather: 'Weather',
        tabCommunity: 'Feed'
    }
};

// Classes
class User {
    constructor(id, phone, pin, name, region, plan = 'free', role = 'user') {
        this.id = id;
        this.phone = phone;
        this.pin = pin;
        this.name = name;
        this.region = region;
        this.plan = plan;
        this.role = role;
        this.lastActive = Date.now();
    }
}

class Tontine {
    constructor(id, name, contribution, members = [], leader) {
        this.id = id;
        this.name = name;
        this.contribution = contribution;
        this.members = members;
        this.leader = leader;
        this.totalContributions = 0;
        this.payments = [];
        this.payoutTurn = 0;
        this.payoutDate = 'N/A';
    }

    addContribution(member, amount) {
        const fee = amount * 0.02;
        this.totalContributions += amount - fee;
        this.payments.push({ member, amount, fee, date: new Date().toLocaleDateString() });
        if (this.payments.length >= this.members.length) {
            this.payoutTurn += 1;
            this.payoutDate = 'Next Month';
        }
        return fee;
    }
}

class Market {
    constructor() {
        this.prices = [
            { crop: 'Maize', price: 250, unit: 'CFA/kg', region: 'bamenda' },
            { crop: 'Cocoa', price: 1800, unit: 'CFA/kg', region: 'bamenda' },
            { crop: 'Yam', price: 350, unit: 'CFA/kg', region: 'bamenda' },
            { crop: 'Maize', price: 260, unit: 'CFA/kg', region: 'douala' },
            { crop: 'Cocoa', price: 1900, unit: 'CFA/kg', region: 'douala' },
            { crop: 'Yam', price: 360, unit: 'CFA/kg', region: 'douala' }
        ];
    }

    updatePrice(crop, price, region, user) {
        if (user.role === 'admin') {
            const existing = this.prices.find(p => p.crop === crop && p.region === region);
            if (existing) {
                existing.price = price;
            } else {
                this.prices.push({ crop, price, unit: 'CFA/kg', region });
            }
        } else {
            alert('Only admins can update prices.');
        }
    }

    getPrices(region) {
        return this.prices.filter(p => p.region === region);
    }
}

// State management
let state = {
    language: localStorage.getItem('language') || 'en',
    user: null,
    tontine: null,
    market: new Market(),
    darkMode: localStorage.getItem('darkMode') === 'true',
    colorTheme: localStorage.getItem('colorTheme') || 'green',
    currentTab: 'auth',
    users: localStorage.getItem('users') ? JSON.parse(localStorage.getItem('users')) : [],
    pendingContributions: localStorage.getItem('pendingContributions') ? JSON.parse(localStorage.getItem('pendingContributions')) : [],
    tourStep: localStorage.getItem('tourCompleted') ? -1 : 0
};

// DOM elements
const elements = {
    headerTitle: document.getElementById('header-title'),
    menuToggle: document.getElementById('menu-toggle'),
    menu: document.getElementById('menu'),
    menuLanguage: document.getElementById('menu-language'),
    menuTheme: document.getElementById('menu-theme'),
    menuColor: document.getElementById('menu-color'),
    menuInfo: document.getElementById('menu-info'),
    menuLogout: document.getElementById('menu-logout'),
    languageModal: document.getElementById('language-modal'),
    languageSelect: document.getElementById('language-select'),
    languageConfirm: document.getElementById('language-confirm'),
    notification: document.getElementById('notification'),
    offlineBanner: document.getElementById('offline-banner'),
    tourOverlay: document.getElementById('tour-overlay'),
    tourTitle: document.getElementById('tour-title'),
    tourText: document.getElementById('tour-text'),
    tourNext: document.getElementById('tour-next'),
    tourSkip: document.getElementById('tour-skip'),
    auth: document.getElementById('auth'),
    authTitle: document.getElementById('auth-title'),
    authForm: document.getElementById('auth-form'),
    authPhone: document.getElementById('auth-phone'),
    authPin: document.getElementById('auth-pin'),
    authLoginBtn: document.getElementById('auth-login-btn'),
    authSignupBtn: document.getElementById('auth-signup-btn'),
    forgotPinLink: document.getElementById('forgot-pin-link'),
    forgotPinForm: document.getElementById('forgot-pin-form'),
    forgotPhone: document.getElementById('forgot-phone'),
    forgotSubmitBtn: document.getElementById('forgot-submit-btn'),
    backToLogin: document.getElementById('back-to-login'),
    dashboard: document.getElementById('dashboard'),
    welcomeText: document.getElementById('welcome-text'),
    dashboardInfo: document.getElementById('dashboard-info'),
    userProfile: document.getElementById('user-profile'),
    tontine: document.getElementById('tontine'),
    tontineTitle: document.getElementById('tontine-title'),
    tontineGroup: document.getElementById('tontine-group'),
    tontineContribution: document.getElementById('tontine-contribution'),
    tontinePayout: document.getElementById('tontine-payout'),
    tontineMembers: document.getElementById('tontine-members'),
    tontineLeader: document.getElementById('tontine-leader'),
    tontineFee: document.getElementById('tontine-fee'),
    joinTontineBtn: document.getElementById('join-tontine-btn'),
    tontineForm: document.getElementById('tontine-form'),
    submitTontineBtn: document.getElementById('submit-tontine'),
    addContributionBtn: document.getElementById('add-contribution-btn'),
    momoPayBtn: document.getElementById('momo-pay-btn'),
    feeBreakdown: document.getElementById('fee-breakdown'),
    groupNameInput: document.getElementById('group-name'),
    contributionAmountInput: document.getElementById('contribution-amount'),
    memberNameInput: document.getElementById('member-name'),
    paymentList: document.getElementById('payment-list'),
    marketPrices: document.getElementById('market-prices'),
    marketTitle: document.getElementById('market-title'),
    regionSelect: document.getElementById('region-select'),
    priceList: document.getElementById('price-list'),
    updatePriceBtn: document.getElementById('update-price-btn'),
    priceUpdateForm: document.getElementById('price-update-form'),
    cropNameInput: document.getElementById('crop-name'),
    cropPriceInput: document.getElementById('crop-price'),
    submitPriceBtn: document.getElementById('submit-price'),
    priceTrendsBtn: document.getElementById('price-trends-btn'),
    weather: document.getElementById('weather'),
    weatherTitle: document.getElementById('weather-title'),
    weatherInfo: document.getElementById('weather-info'),
    communityFeed: document.getElementById('community-feed'),
    communityTitle: document.getElementById('community-title'),
    feedList: document.getElementById('feed-list'),
    info: document.getElementById('info'),
    infoTitle: document.getElementById('info-title'),
    adPlaceholder: document.getElementById('ad-placeholder')
};

// Initialize UI
async function init() {
    let initializing = true;
    try {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
            state.users = JSON.parse(storedUsers);
            state.user = null;
            for (const user of state.users) {
                const storedUser = localStorage.getItem(`user_${user.id}`);
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    if (parsed.lastActive && Date.now() - parsed.lastActive < 30 * 60 * 1000) {
                        state.user = new User(parsed.id, parsed.phone, parsed.pin, parsed.name, parsed.region, parsed.plan, parsed.role);
                        state.tontine = localStorage.getItem(`tontine_${user.id}`) ? JSON.parse(localStorage.getItem(`tontine_${user.id}`)) : null;
                    } else {
                        localStorage.removeItem(`user_${user.id}`);
                    }
                }
            }
        }

        document.body.classList.add(`theme-${state.colorTheme}`);
        updateLanguage();
        updateDarkMode();
        registerServiceWorker();
        await loadDynamicData();
        if (state.user) {
            showMainContent();
            startSessionTimeout();
            if (state.tourStep >= 0) startTour();
        } else {
            showAuth();
            elements.authForm.style.display = 'block';
            elements.forgotPinForm.style.display = 'none';
            speak(translations[state.language].authTitle);
        }
        updateOfflineStatus();
        setupSwipeMenu();
    } finally {
        initializing = false;
        updateTab();
    }
}

// Update language
function updateLanguage() {
    const t = translations[state.language];
    elements.headerTitle.innerHTML = `<i class="fas fa-leaf"></i> ${t.headerTitle}`;
    elements.authTitle.textContent = t.authTitle;
    elements.authLoginBtn.textContent = t.authLoginBtn;
    elements.authSignupBtn.textContent = t.authSignupBtn;
    elements.forgotPinLink.textContent = t.forgotPinLink;
    elements.forgotSubmitBtn.textContent = t.forgotSubmitBtn;
    elements.backToLogin.textContent = t.backToLogin;
    elements.welcomeText.textContent = state.user ? `Welcome, ${state.user.name}!` : t.welcomeText;
    elements.dashboardInfo.textContent = t.dashboardInfo;
    elements.userProfile.textContent = state.user ? `Name: ${state.user.name} | Region: ${state.user.region} | ${state.user.plan === 'premium' ? 'Premium' : 'Free'} Plan` : '';
    elements.tontineTitle.textContent = t.tontineTitle;
    elements.tontineGroup.textContent = state.tontine ? `Group: ${state.tontine.name}` : t.tontineGroup;
    elements.tontineContribution.textContent = state.tontine ? `Contribution: ${state.tontine.totalContributions} CFA` : t.tontineContribution;
    elements.tontinePayout.textContent = state.tontine && state.tontine.payoutDate ? `Next Payout: ${state.tontine.payoutDate}` : t.tontinePayout;
    elements.tontineMembers.textContent = state.tontine ? `Members: ${state.tontine.members.join(', ')}` : t.tontineMembers;
    elements.tontineLeader.textContent = state.tontine ? `Leader: ${state.tontine.leader}` : t.tontineLeader;
    elements.tontineFee.textContent = t.tontineFee;
    elements.joinTontineBtn.textContent = t.joinTontineBtn;
    elements.marketTitle.textContent = t.marketTitle;
    elements.weatherTitle.textContent = t.weatherTitle;
    elements.communityTitle.textContent = t.communityTitle;
    elements.infoTitle.textContent = t.infoTitle;
    elements.menuLanguage.innerHTML = `<i class="fas fa-language"></i> ${t.menuLanguage}`;
    elements.menuTheme.innerHTML = `<i class="fas fa-moon"></i> ${state.darkMode ? (state.language === 'en' ? 'Light Mode' : state.language === 'fr' ? 'Mode Clair' : 'Light Mode') : t.menuTheme}`;
    elements.menuColor.innerHTML = `<i class="fas fa-palette"></i> ${t.menuColor}`;
    elements.menuInfo.innerHTML = `<i class="fas fa-info-circle"></i> ${t.menuInfo}`;
    elements.menuLogout.innerHTML = `<i class="fas fa-sign-out-alt"></i> ${t.menuLogout}`;
    elements.tabDashboard.innerHTML = `<i class="fas fa-home"></i><span>${t.tabDashboard}</span>`;
    elements.tabTontine.innerHTML = `<i class="fas fa-money-bill"></i><span>${t.tabTontine}</span>`;
    elements.tabMarket.innerHTML = `<i class="fas fa-chart-line"></i><span>${t.tabMarket}</span>`;
    elements.tabWeather.innerHTML = `<i class="fas fa-cloud"></i><span>${t.tabWeather}</span>`;
    elements.tabCommunity.innerHTML = `<i class="fas fa-users"></i><span>${t.tabCommunity}</span>`;
    localStorage.setItem('language', state.language);
    updateTab();
}

// Update dark mode
function updateDarkMode() {
    document.body.classList.toggle('dark-mode', state.darkMode);
    document.querySelectorAll('.card').forEach(card => card.classList.toggle('dark-mode', state.darkMode));
    elements.adPlaceholder.classList.toggle('dark-mode', state.darkMode);
    localStorage.setItem('darkMode', state.darkMode);
}

// Update color theme
function updateColorTheme() {
    document.body.classList.remove('theme-green', 'theme-blue', 'theme-orange');
    document.body.classList.add(`theme-${state.colorTheme}`);
    localStorage.setItem('colorTheme', state.colorTheme);
}

// Update tab
function updateTab() {
    console.log('Switching to tab:', state.currentTab);
    document.querySelectorAll('.card').forEach(card => card.classList.remove('active'));
    document.querySelectorAll('.tab-nav button').forEach(btn => btn.classList.remove('active'));
    const activeCard = elements[state.currentTab];
    if (activeCard) {
        activeCard.classList.add('active');
        elements[`tab-${state.currentTab}`].classList.add('active');
        activeCard.offsetHeight; // Force reflow
    } else {
        console.warn('Invalid tab:', state.currentTab);
        state.currentTab = 'dashboard';
        elements.dashboard.classList.add('active');
        elements.tabDashboard.classList.add('active');
    }
    if (state.currentTab === 'tontine') updateTontineUI();
    if (state.currentTab === 'market-prices') updateMarketPrices();
    if (state.currentTab === 'dashboard') updateDashboard();
}

// Show auth screen
function showAuth() {
    console.log('Showing auth screen');
    state.currentTab = 'auth';
    updateTab();
    elements.tabNav.style.display = 'none';
    elements.menuToggle.style.display = 'none';
    elements.adPlaceholder.style.display = 'none';
    elements.authForm.style.display = 'block';
    elements.forgotPinForm.style.display = 'none';
}

// Show main content
function showMainContent() {
    console.log('Showing main content');
    state.currentTab = 'dashboard';
    updateTab();
    elements.tabNav.style.display = 'flex';
    elements.menuToggle.style.display = 'block';
    updateAd();
    elements.adPlaceholder.style.display = 'block';
}

// Update dashboard
function updateDashboard() {
    elements.userProfile.textContent = `Name: ${state.user.name} | Region: ${state.user.region} | ${state.user.plan === 'premium' ? 'Premium' : 'Free'} Plan`;
}

// Update tontine UI
function updateTontineUI() {
    if (state.tontine) {
        elements.tontineGroup.textContent = `Group: ${state.tontine.name}`;
        elements.tontineContribution.textContent = `Contribution: ${state.tontine.totalContributions} CFA`;
        elements.tontinePayout.textContent = `Next Payout: ${state.tontine.payoutDate}`;
        elements.tontineMembers.textContent = `Members: ${state.tontine.members.join(', ')}`;
        elements.tontineLeader.textContent = `Leader: ${state.tontine.leader}`;
        elements.joinTontineBtn.style.display = 'none';
        elements.addContributionBtn.style.display = 'block';
        elements.momoPayBtn.style.display = 'block';
        elements.feeBreakdown.style.display = 'block';
        elements.feeBreakdown.textContent = `Fee: ${state.tontine.contribution * 0.02} CFA`;
        elements.paymentList.innerHTML = state.tontine.payments.map(p => `<li>${p.member}: ${p.amount} CFA (Fee: ${p.fee} CFA) on ${p.date}</li>`).join('');
        alert(`Tontine payment due: ${state.tontine.contribution} CFA by ${new Date().toLocaleDateString()}`);
    }
    localStorage.setItem(`tontine_${state.user.id}`, JSON.stringify(state.tontine));
}

// Update market prices
function updateMarketPrices() {
    const region = elements.regionSelect.value;
    const prices = state.market.getPrices(region);
    elements.priceList.innerHTML = prices.map(p => `<li>${p.crop}: ${p.price} ${p.unit}</li>`).join('');
}

// Update ad
function updateAd() {
    elements.adPlaceholder.textContent = state.user.region === 'bamenda' ? 'Bamenda Seeds 10% Off!' : 'Douala Fertilizers 20% Off!';
}

// Show notification
function showNotification(message) {
    elements.notification.textContent = message;
    elements.notification.style.display = 'block';
    speak(message);
    setTimeout(() => elements.notification.style.display = 'none', 3000);
}

// Update offline status
function updateOfflineStatus() {
    elements.offlineBanner.style.display = navigator.onLine ? 'none' : 'block';
}

// Voice prompt
function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = state.language === 'fr' ? 'fr-FR' : 'en-US';
        speechSynthesis.speak(utterance);
    }
}

// Guided tour
function startTour() {
    if (state.tourStep < translations[state.language].tourText.length) {
        elements.tourOverlay.classList.add('active');
        elements.tourTitle.textContent = translations[state.language].tourTitle;
        elements.tourText.textContent = translations[state.language].tourText[state.tourStep];
        speak(elements.tourText.textContent);
    } else {
        endTour();
    }
}

function endTour() {
    elements.tourOverlay.classList.remove('active');
    localStorage.setItem('tourCompleted', true);
    state.tourStep = -1;
}

// Load dynamic data
async function loadDynamicData() {
    if (navigator.onLine) {
        try {
            const priceRes = await fetch('https://jsonplaceholder.typicode.com/posts/1');
            const priceData = await priceRes.json();
            state.market.prices.push({ crop: 'Cassava', price: 400, unit: 'CFA/kg', region: 'bamenda' });
            localStorage.setItem(`market_${state.user ? state.user.id : 'guest'}`, JSON.stringify(state.market));
            elements.weatherInfo.textContent = 'Bamenda: Sunny, 28°C, Rain expected tomorrow (OpenWeatherMap placeholder)';
        } catch (e) {
            console.error('API error:', e);
        }
    } else {
        const cachedMarket = localStorage.getItem(`market_${state.user ? state.user.id : 'guest'}`);
        if (cachedMarket) state.market = JSON.parse(cachedMarket);
    }
}

// Auth logic
async function hashPin(pin) {
    const buffer = new TextEncoder().encode(pin);
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function login(phone, pin) {
    const hashedPin = await hashPin(pin);
    const user = state.users.find(u => u.phone === phone && u.pin === hashedPin);
    if (user) {
        state.user = new User(user.id, user.phone, user.pin, user.name, user.region, user.plan, user.role);
        state.user.lastActive = Date.now();
        localStorage.setItem(`user_${user.id}`, JSON.stringify(state.user));
        state.tontine = localStorage.getItem(`tontine_${user.id}`) ? JSON.parse(localStorage.getItem(`tontine_${user.id}`)) : null;
        showMainContent();
        startSessionTimeout();
        showNotification(translations[state.language].notification);
        if (!localStorage.getItem('tourCompleted')) startTour();
    } else {
        alert('Invalid phone or PIN.');
    }
}

async function signup(phone, pin, name, region) {
    const hashedPin = await hashPin(pin);
    if (state.users.find(u => u.phone === phone)) {
        alert('Phone already exists.');
        return;
    }
    const id = `user-${Date.now()}`;
    const user = new User(id, phone, hashedPin, name, region, 'free', 'user');
    state.users.push(user);
    state.user = user;
    localStorage.setItem(`users`, JSON.stringify(state.users));
    localStorage.setItem(`user_${id}`, JSON.stringify(user));
    showMainContent();
    startSessionTimeout();
    showNotification(translations[state.language].notification);
    startTour();
}

async function forgotPin(phone) {
    if (state.users.find(u => u.phone === phone)) {
        const tempPin = '1234';
        localStorage.setItem(`resetPin_${phone}`, await hashPin(tempPin));
        alert(`Temporary PIN sent: ${tempPin} (Simulated for MVP)`);
    } else {
        alert('Phone not found.');
    }
}

function startSessionTimeout() {
    setTimeout(() => {
        state.user = null;
        state.tontine = null;
        localStorage.removeItem(`user_${state.user.id}`);
        localStorage.removeItem(`tontine_${state.user.id}`);
        showAuth();
        showNotification('Session timed out.');
    }, 30 * 60 * 1000);
}

// Swipe menu
function setupSwipeMenu() {
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX - touchStartX > 50) {
            elements.menu.classList.add('open');
        } else if (touchStartX - touchEndX > 50) {
            elements.menu.classList.remove('open');
        }
    });
}

// Event listeners
elements.menuToggle.addEventListener('click', () => {
    console.log('Menu toggle clicked');
    elements.menu.classList.toggle('open');
});

elements.menuLanguage.addEventListener('click', () => {
    console.log('Language menu clicked');
    elements.languageModal.classList.add('active');
    elements.menu.classList.remove('open');
});

elements.languageConfirm.addEventListener('click', () => {
    state.language = elements.languageSelect.value;
    updateLanguage();
    elements.languageModal.classList.remove('active');
    showNotification('Language updated');
});

elements.menuTheme.addEventListener('click', () => {
    console.log('Theme menu clicked');
    state.darkMode = !state.darkMode;
    updateDarkMode();
    updateLanguage();
    elements.menu.classList.remove('open');
});

elements.menuColor.addEventListener('click', () => {
    console.log('Color menu clicked');
    state.colorTheme = state.colorTheme === 'green' ? 'blue' : state.colorTheme === 'blue' ? 'orange' : 'green';
    updateColorTheme();
    updateLanguage();
    elements.menu.classList.remove('open');
});

elements.menuInfo.addEventListener('click', () => {
    console.log('Info menu clicked');
    state.currentTab = 'info';
    updateTab();
    elements.menu.classList.remove('open');
});

elements.menuLogout.addEventListener('click', () => {
    console.log('Logout menu clicked');
    state.user = null;
    state.tontine = null;
    localStorage.removeItem(`user_${state.user.id}`);
    localStorage.removeItem(`tontine_${state.user.id}`);
    showAuth();
    elements.menu.classList.remove('open');
});

elements.authLoginBtn.addEventListener('click', async () => {
    console.log('Login button clicked');
    const phone = elements.authPhone.value.trim();
    const pin = elements.authPin.value.trim();
    await login(phone, pin);
});

elements.authSignupBtn.addEventListener('click', () => {
    console.log('Signup button clicked');
    elements.authTitle.textContent = translations[state.language].authSignupBtn;
    elements.authLoginBtn.style.display = 'none';
    elements.authSignupBtn.style.display = 'none';
    elements.forgotPinLink.style.display = 'none';
    elements.authForm.innerHTML = `
        <div class="form-group">
            <input type="tel" id="signup-phone" placeholder="Phone (e.g., +237 6XX XXX XXX)">
        </div>
        <div class="form-group">
            <input type="number" id="signup-pin" placeholder="4-Digit PIN" maxlength="4">
        </div>
        <div class="form-group">
            <input type="text" id="signup-name" placeholder="Name">
        </div>
        <div class="form-group">
            <select id="signup-region">
                <option value="bamenda">Bamenda</option>
                <option value="douala">Douala</option>
            </select>
        </div>
        <button class="btn" id="submit-signup">Sign Up</button>
        <p id="back-to-login" style="text-align: center; cursor: pointer;">${translations[state.language].backToLogin}</p>
    `;
    document.getElementById('submit-signup').addEventListener('click', async () => {
        console.log('Submit signup clicked');
        const phone = document.getElementById('signup-phone').value.trim();
        const pin = document.getElementById('signup-pin').value.trim();
        const name = document.getElementById('signup-name').value.trim();
        const region = document.getElementById('signup-region').value;
        await signup(phone, pin, name, region);
    });
    document.getElementById('back-to-login').addEventListener('click', () => {
        showAuth();
    });
});

elements.forgotPinLink.addEventListener('click', () => {
    console.log('Forgot PIN clicked');
    elements.authForm.style.display = 'none';
    elements.forgotPinForm.style.display = 'block';
    speak(translations[state.language].forgotPinLink);
});

elements.forgotSubmitBtn.addEventListener('click', async () => {
    console.log('Reset PIN clicked');
    const phone = elements.forgotPhone.value.trim();
    await forgotPin(phone);
    elements.forgotPinForm.style.display = 'none';
    elements.authForm.style.display = 'block';
});

elements.backToLogin.addEventListener('click', () => {
    console.log('Back to login clicked');
    elements.forgotPinForm.style.display = 'none';
    elements.authForm.style.display = 'block';
});

elements.tourNext.addEventListener('click', () => {
    console.log('Tour next clicked');
    state.tourStep++;
    startTour();
});

elements.tourSkip.addEventListener('click', () => {
    console.log('Tour skip clicked');
    endTour();
});

elements.tabDashboard.addEventListener('click', () => {
    console.log('Dashboard tab clicked');
    state.currentTab = 'dashboard';
    updateTab();
});

elements.tabTontine.addEventListener('click', () => {
    console.log('Tontine tab clicked');
    state.currentTab = 'tontine';
    updateTab();
});

elements.tabMarket.addEventListener('click', () => {
    console.log('Market tab clicked');
    state.currentTab = 'market-prices';
    updateTab();
});

elements.tabWeather.addEventListener('click', () => {
    console.log('Weather tab clicked');
    state.currentTab = 'weather';
    updateTab();
});

elements.tabCommunity.addEventListener('click', () => {
    console.log('Community tab clicked');
    state.currentTab = 'community-feed';
    updateTab();
});

elements.joinTontineBtn.addEventListener('click', () => {
    console.log('Join tontine clicked');
    elements.tontineForm.style.display = elements.tontineForm.style.display === 'none' ? 'block' : 'none';
    speak(translations[state.language].joinTontineBtn);
});

elements.submitTontineBtn.addEventListener('click', () => {
    console.log('Submit tontine clicked');
    const groupName = elements.groupNameInput.value.trim();
    const contribution = parseInt(elements.contributionAmountInput.value);
    const memberName = elements.memberNameInput.value.trim();
    if (groupName && contribution > 0) {
        state.tontine = new Tontine(`tontine-${Date.now()}`, groupName, contribution, [state.user.name, ...(memberName ? [memberName] : [])], state.user.name);
        updateTontineUI();
        elements.tontineForm.style.display = 'none';
        elements.joinTontineBtn.style.display = 'none';
        elements.addContributionBtn.style.display = 'block';
        elements.momoPayBtn.style.display = 'block';
        elements.groupNameInput.value = '';
        elements.contributionAmountInput.value = '';
        elements.memberNameInput.value = '';
        showNotification(translations[state.language].notification);
    } else {
        alert(translations[state.language].en ? 'Please enter valid group name and contribution.' : 'Veuillez entrer un nom de groupe et une contribution valides.');
    }
});

elements.addContributionBtn.addEventListener('click', () => {
    console.log('Add contribution clicked');
    if (state.tontine) {
        if (navigator.onLine) {
            const fee = state.tontine.addContribution(state.user.name, state.tontine.contribution);
            updateTontineUI();
            showNotification(`${translations[state.language].notification} Fee: ${fee} CFA`);
        } else {
            state.pendingContributions.push({ member: state.user.name, amount: state.tontine.contribution });
            localStorage.setItem('pendingContributions', JSON.stringify(state.pendingContributions));
            showNotification('Contribution queued for when online.');
        }
    }
});

elements.momoPayBtn.addEventListener('click', () => {
    console.log('MoMo payment clicked');
    alert('Simulated MoMo payment: Enter phone and confirm.');
    elements.addContributionBtn.click();
});

elements.regionSelect.addEventListener('change', () => {
    console.log('Region select changed');
    updateMarketPrices();
});

elements.updatePriceBtn.addEventListener('click', () => {
    console.log('Update price clicked');
    elements.priceUpdateForm.style.display = elements.priceUpdateForm.style.display === 'none' ? 'block' : 'none';
});

elements.submitPriceBtn.addEventListener('click', () => {
    console.log('Submit price clicked');
    const crop = elements.cropNameInput.value.trim();
    const price = parseInt(elements.cropPriceInput.value);
    const region = elements.regionSelect.value;
    if (crop && price > 0) {
        state.market.updatePrice(crop, price, region, state.user);
        localStorage.setItem(`market_${state.user.id}`, JSON.stringify(state.market));
        updateMarketPrices();
        elements.priceUpdateForm.style.display = 'none';
        elements.cropNameInput.value = '';
        elements.cropPriceInput.value = '';
        showNotification(translations[state.language].notification);
    } else {
        alert(translations[state.language].en ? 'Please enter valid crop name and price.' : 'Veuillez entrer un nom de culture et un prix valides.');
    }
});

elements.priceTrendsBtn.addEventListener('click', () => {
    console.log('Price trends clicked');
    if (state.user.plan === 'premium' || !localStorage.getItem('freeTrend')) {
        alert('Price trends: Maize +10% this month (Premium feature)');
        if (!state.user.plan === 'premium') localStorage.setItem('freeTrend', true);
    } else {
        alert(translations[state.language].premiumFeature);
    }
});

window.addEventListener('online', () => {
    updateOfflineStatus();
    if (state.pendingContributions.length) {
        state.pendingContributions.forEach(contrib => {
            const fee = state.tontine.addContribution(contrib.member, contrib.amount);
            showNotification(`Synced contribution. Fee: ${fee} CFA`);
        });
        state.pendingContributions = [];
        localStorage.setItem('pendingContributions', JSON.stringify(state.pendingContributions));
        updateTontineUI();
    }
});

window.addEventListener('offline', updateOfflineStatus);

// Offline support
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(() => {
            console.log('Service Worker registered');
        }).catch(err => console.error('Service Worker error:', err));
    }
}

// Export data
function exportData() {
    return JSON.stringify({
        users: state.users,
        tontine: state.tontine,
        market: state.market
    });
}

// Initialize app
init();
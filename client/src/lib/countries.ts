// Country configuration for internationalization
export interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  currency: string;
  languages: string[];
  regions: string[];
}

export const countries: Country[] = [
  {
    code: 'CM',
    name: 'Cameroon',
    flag: '🇨🇲',
    phoneCode: '+237',
    currency: 'XAF',
    languages: ['en', 'fr'],
    regions: ['bamenda', 'douala', 'yaounde', 'bafoussam', 'garoua', 'maroua']
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    phoneCode: '+234',
    currency: 'NGN',
    languages: ['en'],
    regions: ['lagos', 'abuja', 'kano', 'ibadan', 'port_harcourt', 'kaduna']
  },
  {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    phoneCode: '+233',
    currency: 'GHS',
    languages: ['en'],
    regions: ['accra', 'kumasi', 'tamale', 'cape_coast', 'sunyani', 'koforidua']
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    phoneCode: '+254',
    currency: 'KES',
    languages: ['en', 'sw'],
    regions: ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika']
  },
  {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    phoneCode: '+225',
    currency: 'XOF',
    languages: ['fr'],
    regions: ['abidjan', 'bouake', 'daloa', 'yamoussoukro', 'korhogo', 'san_pedro']
  },
  {
    code: 'SN',
    name: 'Senegal',
    flag: '🇸🇳',
    phoneCode: '+221',
    currency: 'XOF',
    languages: ['fr', 'wo'],
    regions: ['dakar', 'thies', 'saint_louis', 'kaolack', 'ziguinchor', 'tambacounda']
  },
  {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    phoneCode: '+256',
    currency: 'UGX',
    languages: ['en'],
    regions: ['kampala', 'gulu', 'lira', 'mbarara', 'jinja', 'masaka']
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    phoneCode: '+255',
    currency: 'TZS',
    languages: ['en', 'sw'],
    regions: ['dar_es_salaam', 'mwanza', 'arusha', 'dodoma', 'mbeya', 'tanga']
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    phoneCode: '+27',
    currency: 'ZAR',
    languages: ['en', 'af', 'zu', 'xh'],
    regions: ['johannesburg', 'cape_town', 'durban', 'pretoria', 'port_elizabeth', 'bloemfontein']
  },
  {
    code: 'EG',
    name: 'Egypt',
    flag: '🇪🇬',
    phoneCode: '+20',
    currency: 'EGP',
    languages: ['ar', 'en'],
    regions: ['cairo', 'alexandria', 'giza', 'luxor', 'aswan', 'port_said']
  }
];

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' }
];

export const currencies = {
  XAF: { symbol: 'FCFA', name: 'Central African CFA Franc' },
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  GHS: { symbol: '₵', name: 'Ghanaian Cedi' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  XOF: { symbol: 'FCFA', name: 'West African CFA Franc' },
  UGX: { symbol: 'USh', name: 'Ugandan Shilling' },
  TZS: { symbol: 'TSh', name: 'Tanzanian Shilling' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  EGP: { symbol: '£', name: 'Egyptian Pound' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' }
};

export function getCountryByCode(code: string): Country | undefined {
  return countries.find(country => country.code === code);
}

export function getRegionsByCountry(countryCode: string): string[] {
  const country = getCountryByCode(countryCode);
  return country?.regions || [];
}

export function getLanguagesByCountry(countryCode: string): string[] {
  const country = getCountryByCode(countryCode);
  return country?.languages || ['en'];
}

export function getCurrencyByCountry(countryCode: string): string {
  const country = getCountryByCode(countryCode);
  return country?.currency || 'USD';
}

export function searchCountries(query: string): Country[] {
  const searchTerm = query.toLowerCase();
  return countries.filter(country => 
    country.name.toLowerCase().includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm)
  );
}

export function searchLanguages(query: string) {
  const searchTerm = query.toLowerCase();
  return languages.filter(lang => 
    lang.name.toLowerCase().includes(searchTerm) ||
    lang.nativeName.toLowerCase().includes(searchTerm) ||
    lang.code.toLowerCase().includes(searchTerm)
  );
}
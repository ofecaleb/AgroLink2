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
    code: 'AD',
    name: 'Andorra',
    flag: '🇦🇩',
    phoneCode: '+376',
    currency: 'EUR',
    languages: ['es'],
    regions: ['andorra_la_vella', 'canillo', 'encamp', 'escaldes_engordany']
  },
  {
    code: 'AO',
    name: 'Angola',
    flag: '🇦🇴',
    phoneCode: '+244',
    currency: 'AOA',
    languages: ['pt'],
    regions: ['luanda', 'benguela', 'huambo', 'lobito', 'cabinda', 'lubango']
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    phoneCode: '+226',
    currency: 'XOF',
    languages: ['fr'],
    regions: ['ouagadougou', 'bobo_dioulasso', 'koudougou', 'banfora', 'ouahigouya', 'pouytenga']
  },
  {
    code: 'BI',
    name: 'Burundi',
    flag: '🇧🇮',
    phoneCode: '+257',
    currency: 'BIF',
    languages: ['rn', 'fr'],
    regions: ['bujumbura', 'gitega', 'muyinga', 'ngozi', 'ruyigi', 'kayanza']
  },
  {
    code: 'BJ',
    name: 'Benin',
    flag: '🇧🇯',
    phoneCode: '+229',
    currency: 'XOF',
    languages: ['fr'],
    regions: ['cotonou', 'porto_novo', 'parakou', 'djougou', 'bohicon', 'kandi']
  },
  {
    code: 'BW',
    name: 'Botswana',
    flag: '🇧🇼',
    phoneCode: '+267',
    currency: 'BWP',
    languages: ['en'],
    regions: ['gaborone', 'francistown', 'molepolole', 'serowe', 'selibe_phikwe', 'maun']
  },
  {
    code: 'CD',
    name: 'Democratic Republic of Congo',
    flag: '🇨🇩',
    phoneCode: '+243',
    currency: 'CDF',
    languages: ['fr'],
    regions: ['kinshasa', 'lubumbashi', 'mbuji_mayi', 'kisangani', 'kananga', 'bukavu']
  },
  {
    code: 'CF',
    name: 'Central African Republic',
    flag: '🇨🇫',
    phoneCode: '+236',
    currency: 'XAF',
    languages: ['fr'],
    regions: ['bangui', 'berberat', 'carnot', 'bambari', 'bouar', 'bossangoa']
  },
  {
    code: 'CG',
    name: 'Republic of Congo',
    flag: '🇨🇬',
    phoneCode: '+242',
    currency: 'XAF',
    languages: ['fr'],
    regions: ['brazzaville', 'pointe_noire', 'dolisie', 'nkayi', 'mossendjo', 'kinkala']
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
    code: 'CM',
    name: 'Cameroon',
    flag: '🇨🇲',
    phoneCode: '+237',
    currency: 'XAF',
    languages: ['en', 'fr'],
    regions: ['bamenda', 'douala', 'yaounde', 'bafoussam', 'garoua', 'maroua']
  },
  {
    code: 'CV',
    name: 'Cape Verde',
    flag: '🇨🇻',
    phoneCode: '+238',
    currency: 'CVE',
    languages: ['pt'],
    regions: ['praia', 'mindelo', 'santa_maria', 'assomada', 'porto_novo', 'espargos']
  },
  {
    code: 'DJ',
    name: 'Djibouti',
    flag: '🇩🇯',
    phoneCode: '+253',
    currency: 'DJF',
    languages: ['fr', 'ar'],
    regions: ['djibouti', 'ali_sabieh', 'dikhil', 'tadjourah', 'obock', 'arta']
  },
  {
    code: 'DZ',
    name: 'Algeria',
    flag: '🇩🇿',
    phoneCode: '+213',
    currency: 'DZD',
    languages: ['ar', 'fr'],
    regions: ['algiers', 'oran', 'constantine', 'annaba', 'blida', 'batna']
  },
  {
    code: 'EG',
    name: 'Egypt',
    flag: '🇪🇬',
    phoneCode: '+20',
    currency: 'EGP',
    languages: ['ar', 'en'],
    regions: ['cairo', 'alexandria', 'giza', 'luxor', 'aswan', 'port_said']
  },
  {
    code: 'ER',
    name: 'Eritrea',
    flag: '🇪🇷',
    phoneCode: '+291',
    currency: 'ERN',
    languages: ['ti', 'ar'],
    regions: ['asmara', 'keren', 'massawa', 'assab', 'mendefera', 'barentu']
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    phoneCode: '+251',
    currency: 'ETB',
    languages: ['am', 'om'],
    regions: ['addis_ababa', 'dire_dawa', 'mekelle', 'gondar', 'hawassa', 'bahir_dar']
  },
  {
    code: 'GA',
    name: 'Gabon',
    flag: '🇬🇦',
    phoneCode: '+241',
    currency: 'XAF',
    languages: ['fr'],
    regions: ['libreville', 'port_gentil', 'franceville', 'oyem', 'moanda', 'mouila']
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
    code: 'GM',
    name: 'Gambia',
    flag: '🇬🇲',
    phoneCode: '+220',
    currency: 'GMD',
    languages: ['en'],
    regions: ['banjul', 'serekunda', 'brikama', 'bakau', 'farafenni', 'lamin']
  },
  {
    code: 'GN',
    name: 'Guinea',
    flag: '🇬🇳',
    phoneCode: '+224',
    currency: 'GNF',
    languages: ['fr'],
    regions: ['conakry', 'kankan', 'labe', 'nzerekore', 'kindia', 'mamou']
  },
  {
    code: 'GQ',
    name: 'Equatorial Guinea',
    flag: '🇬🇶',
    phoneCode: '+240',
    currency: 'XAF',
    languages: ['es', 'fr'],
    regions: ['malabo', 'bata', 'ebebiyin', 'aconibe', 'anisoc', 'luba']
  },
  {
    code: 'GW',
    name: 'Guinea-Bissau',
    flag: '🇬🇼',
    phoneCode: '+245',
    currency: 'XOF',
    languages: ['pt'],
    regions: ['bissau', 'bafata', 'gabu', 'bissorã', 'bolama', 'cacheu']
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
    code: 'KM',
    name: 'Comoros',
    flag: '🇰🇲',
    phoneCode: '+269',
    currency: 'KMF',
    languages: ['ar', 'fr'],
    regions: ['moroni', 'mutsamudu', 'fomboni', 'domoni', 'moya', 'ouani']
  },
  {
    code: 'LR',
    name: 'Liberia',
    flag: '🇱🇷',
    phoneCode: '+231',
    currency: 'LRD',
    languages: ['en'],
    regions: ['monrovia', 'gbarnga', 'kakata', 'voinjama', 'harper', 'zwedru']
  },
  {
    code: 'LS',
    name: 'Lesotho',
    flag: '🇱🇸',
    phoneCode: '+266',
    currency: 'LSL',
    languages: ['en'],
    regions: ['maseru', 'teyateyaneng', 'mafeteng', 'hlotse', 'mohales_hoek', 'qacha']
  },
  {
    code: 'LY',
    name: 'Libya',
    flag: '🇱🇾',
    phoneCode: '+218',
    currency: 'LYD',
    languages: ['ar'],
    regions: ['tripoli', 'benghazi', 'misrata', 'tarhuna', 'al_bayda', 'zawyia']
  },
  {
    code: 'MA',
    name: 'Morocco',
    flag: '🇲🇦',
    phoneCode: '+212',
    currency: 'MAD',
    languages: ['ar', 'fr'],
    regions: ['casablanca', 'rabat', 'fez', 'marrakech', 'agadir', 'tangier']
  },
  {
    code: 'MG',
    name: 'Madagascar',
    flag: '🇲🇬',
    phoneCode: '+261',
    currency: 'MGA',
    languages: ['mg', 'fr'],
    regions: ['antananarivo', 'toamasina', 'antsirabe', 'fianarantsoa', 'mahajanga', 'toliara']
  },
  {
    code: 'ML',
    name: 'Mali',
    flag: '🇲🇱',
    phoneCode: '+223',
    currency: 'XOF',
    languages: ['fr'],
    regions: ['bamako', 'sikasso', 'koutiala', 'kayes', 'mopti', 'segou']
  },
  {
    code: 'MR',
    name: 'Mauritania',
    flag: '🇲🇷',
    phoneCode: '+222',
    currency: 'MRU',
    languages: ['ar', 'fr'],
    regions: ['nouakchott', 'nouadhibou', 'nema', 'kaedi', 'rosso', 'zouerate']
  },
  {
    code: 'MU',
    name: 'Mauritius',
    flag: '🇲🇺',
    phoneCode: '+230',
    currency: 'MUR',
    languages: ['en', 'fr'],
    regions: ['port_louis', 'beau_bassin', 'phoenix', 'quatre_bornes', 'rose_hill', 'curepipe']
  },
  {
    code: 'MW',
    name: 'Malawi',
    flag: '🇲🇼',
    phoneCode: '+265',
    currency: 'MWK',
    languages: ['en'],
    regions: ['lilongwe', 'blantyre', 'mzuzu', 'zomba', 'kasungu', 'mangochi']
  },
  {
    code: 'MZ',
    name: 'Mozambique',
    flag: '🇲🇿',
    phoneCode: '+258',
    currency: 'MZN',
    languages: ['pt'],
    regions: ['maputo', 'matola', 'beira', 'nampula', 'chimoio', 'nacala']
  },
  {
    code: 'NA',
    name: 'Namibia',
    flag: '🇳🇦',
    phoneCode: '+264',
    currency: 'NAD',
    languages: ['en', 'af'],
    regions: ['windhoek', 'rundu', 'walvis_bay', 'oshakati', 'swakopmund', 'katima_mulilo']
  },
  {
    code: 'NE',
    name: 'Niger',
    flag: '🇳🇪',
    phoneCode: '+227',
    currency: 'XOF',
    languages: ['fr'],
    regions: ['niamey', 'zinder', 'maradi', 'agadez', 'tahoua', 'dosso']
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    phoneCode: '+234',
    currency: 'NGN',
    languages: ['en', 'ha', 'ig', 'yo'],
    regions: ['lagos', 'abuja', 'kano', 'ibadan', 'port_harcourt', 'kaduna']
  },
  {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    phoneCode: '+250',
    currency: 'RWF',
    languages: ['rw', 'en', 'fr'],
    regions: ['kigali', 'butare', 'gitarama', 'ruhengeri', 'gisenyi', 'cyangugu']
  },
  {
    code: 'SC',
    name: 'Seychelles',
    flag: '🇸🇨',
    phoneCode: '+248',
    currency: 'SCR',
    languages: ['en', 'fr'],
    regions: ['victoria', 'anse_boileau', 'beau_vallon', 'cascade', 'english_river', 'mont_fleuri']
  },
  {
    code: 'SD',
    name: 'Sudan',
    flag: '🇸🇩',
    phoneCode: '+249',
    currency: 'SDG',
    languages: ['ar', 'en'],
    regions: ['khartoum', 'omdurman', 'kassala', 'el_obeid', 'nyala', 'port_sudan']
  },
  {
    code: 'SL',
    name: 'Sierra Leone',
    flag: '🇸🇱',
    phoneCode: '+232',
    currency: 'SLL',
    languages: ['en'],
    regions: ['freetown', 'bo', 'kenema', 'koidu', 'makeni', 'lunsar']
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
    code: 'SO',
    name: 'Somalia',
    flag: '🇸🇴',
    phoneCode: '+252',
    currency: 'SOS',
    languages: ['so', 'ar'],
    regions: ['mogadishu', 'hargeisa', 'bosaso', 'kismayo', 'baidoa', 'galkayo']
  },
  {
    code: 'SS',
    name: 'South Sudan',
    flag: '🇸🇸',
    phoneCode: '+211',
    currency: 'SSP',
    languages: ['en', 'ar'],
    regions: ['juba', 'wau', 'malakal', 'bentiu', 'bor', 'yei']
  },
  {
    code: 'ST',
    name: 'São Tomé and Príncipe',
    flag: '🇸🇹',
    phoneCode: '+239',
    currency: 'STN',
    languages: ['pt'],
    regions: ['sao_tome', 'santo_antonio', 'neves', 'trindade', 'santana', 'guadalupe']
  },
  {
    code: 'SZ',
    name: 'Eswatini',
    flag: '🇸🇿',
    phoneCode: '+268',
    currency: 'SZL',
    languages: ['en'],
    regions: ['mbabane', 'manzini', 'big_bend', 'malkerns', 'nhlangano', 'piggs_peak']
  },
  {
    code: 'TD',
    name: 'Chad',
    flag: '🇹🇩',
    phoneCode: '+235',
    currency: 'XAF',
    languages: ['fr', 'ar'],
    regions: ['ndjamena', 'moundou', 'sarh', 'abéché', 'kelo', 'koumra']
  },
  {
    code: 'TG',
    name: 'Togo',
    flag: '🇹🇬',
    phoneCode: '+228',
    currency: 'XOF',
    languages: ['fr'],
    regions: ['lome', 'sokode', 'kara', 'kpalime', 'atakpame', 'dapaong']
  },
  {
    code: 'TN',
    name: 'Tunisia',
    flag: '🇹🇳',
    phoneCode: '+216',
    currency: 'TND',
    languages: ['ar', 'fr'],
    regions: ['tunis', 'sfax', 'sousse', 'kairouan', 'bizerte', 'gabes']
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
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    phoneCode: '+256',
    currency: 'UGX',
    languages: ['en', 'lg'],
    regions: ['kampala', 'gulu', 'lira', 'mbarara', 'jinja', 'masaka']
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
    code: 'ZM',
    name: 'Zambia',
    flag: '🇿🇲',
    phoneCode: '+260',
    currency: 'ZMW',
    languages: ['en'],
    regions: ['lusaka', 'kitwe', 'ndola', 'kabwe', 'chingola', 'mufulira']
  },
  {
    code: 'ZW',
    name: 'Zimbabwe',
    flag: '🇿🇼',
    phoneCode: '+263',
    currency: 'ZWL',
    languages: ['en'],
    regions: ['harare', 'bulawayo', 'chitungwiza', 'mutare', 'gweru', 'kwekwe']
  }
];

export const languages = [
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'lg', name: 'Luganda', nativeName: 'Luganda' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'rn', name: 'Kirundi', nativeName: 'Kirundi' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Kinyarwanda' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' }
];

export const currencies = {
  AOA: { symbol: 'Kz', name: 'Angolan Kwanza' },
  BIF: { symbol: 'FBu', name: 'Burundian Franc' },
  BWP: { symbol: 'P', name: 'Botswanan Pula' },
  CDF: { symbol: 'FC', name: 'Congolese Franc' },
  CVE: { symbol: '$', name: 'Cape Verdean Escudo' },
  DJF: { symbol: 'Fdj', name: 'Djiboutian Franc' },
  DZD: { symbol: 'دج', name: 'Algerian Dinar' },
  EGP: { symbol: '£', name: 'Egyptian Pound' },
  ERN: { symbol: 'Nfk', name: 'Eritrean Nakfa' },
  ETB: { symbol: 'Br', name: 'Ethiopian Birr' },
  EUR: { symbol: '€', name: 'Euro' },
  GHS: { symbol: '₵', name: 'Ghanaian Cedi' },
  GMD: { symbol: 'D', name: 'Gambian Dalasi' },
  GNF: { symbol: 'FG', name: 'Guinean Franc' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  KMF: { symbol: 'CF', name: 'Comorian Franc' },
  LRD: { symbol: '$', name: 'Liberian Dollar' },
  LSL: { symbol: 'L', name: 'Lesotho Loti' },
  LYD: { symbol: 'ل.د', name: 'Libyan Dinar' },
  MAD: { symbol: 'د.م.', name: 'Moroccan Dirham' },
  MGA: { symbol: 'Ar', name: 'Malagasy Ariary' },
  MRU: { symbol: 'UM', name: 'Mauritanian Ouguiya' },
  MUR: { symbol: '₨', name: 'Mauritian Rupee' },
  MWK: { symbol: 'MK', name: 'Malawian Kwacha' },
  MZN: { symbol: 'MT', name: 'Mozambican Metical' },
  NAD: { symbol: '$', name: 'Namibian Dollar' },
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  RWF: { symbol: 'R₣', name: 'Rwandan Franc' },
  SCR: { symbol: '₨', name: 'Seychellois Rupee' },
  SDG: { symbol: 'ج.س.', name: 'Sudanese Pound' },
  SLL: { symbol: 'Le', name: 'Sierra Leonean Leone' },
  SOS: { symbol: 'S', name: 'Somali Shilling' },
  SSP: { symbol: '£', name: 'South Sudanese Pound' },
  STN: { symbol: 'Db', name: 'São Tomé and Príncipe Dobra' },
  SZL: { symbol: 'L', name: 'Swazi Lilangeni' },
  TND: { symbol: 'د.ت', name: 'Tunisian Dinar' },
  TZS: { symbol: 'TSh', name: 'Tanzanian Shilling' },
  UGX: { symbol: 'USh', name: 'Ugandan Shilling' },
  USD: { symbol: '$', name: 'US Dollar' },
  XAF: { symbol: 'FCFA', name: 'Central African CFA Franc' },
  XOF: { symbol: 'CFA', name: 'West African CFA Franc' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  ZMW: { symbol: 'ZK', name: 'Zambian Kwacha' },
  ZWL: { symbol: 'Z$', name: 'Zimbabwean Dollar' }
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
    country.code.toLowerCase().includes(searchTerm) ||
    country.phoneCode.includes(searchTerm)
  );
}

export function searchLanguages(query: string): typeof languages {
  const searchTerm = query.toLowerCase();
  return languages.filter(language => 
    language.name.toLowerCase().includes(searchTerm) ||
    language.nativeName.toLowerCase().includes(searchTerm) ||
    language.code.toLowerCase().includes(searchTerm)
  );
}
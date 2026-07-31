export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rateToUSD: number; // 1 USD = X local units
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToUSD: 1.0, flag: '🇺🇸' },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', rateToUSD: 1500.0, flag: '🇳🇬' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToUSD: 0.92, flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToUSD: 0.78, flag: '🇬🇧' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rateToUSD: 1.38, flag: '🇨🇦' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateToUSD: 1.52, flag: '🇦🇺' },
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', rateToUSD: 15.5, flag: '🇬🇭' },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', rateToUSD: 129.0, flag: '🇰🇪' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', rateToUSD: 18.2, flag: '🇿🇦' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToUSD: 83.5, flag: '🇮🇳' },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', rateToUSD: 3.67, flag: '🇦🇪' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', rateToUSD: 5.5, flag: '🇧🇷' },
  MXN: { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', rateToUSD: 18.5, flag: '🇲🇽' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateToUSD: 155.0, flag: '🇯🇵' },
};

export const COUNTRY_TO_CURRENCY_MAP: Record<string, string> = {
  Nigeria: 'NGN',
  'United Kingdom': 'GBP',
  UK: 'GBP',
  'Great Britain': 'GBP',
  Spain: 'EUR',
  France: 'EUR',
  Germany: 'EUR',
  Italy: 'EUR',
  Netherlands: 'EUR',
  Portugal: 'EUR',
  Ireland: 'EUR',
  Greece: 'EUR',
  Austria: 'EUR',
  Belgium: 'EUR',
  Finland: 'EUR',
  'United States': 'USD',
  USA: 'USD',
  US: 'USD',
  Canada: 'CAD',
  Australia: 'AUD',
  Ghana: 'GHS',
  Kenya: 'KES',
  'South Africa': 'ZAR',
  India: 'INR',
  'United Arab Emirates': 'AED',
  UAE: 'AED',
  Brazil: 'BRL',
  Mexico: 'MXN',
  Japan: 'JPY',
};

/**
 * Retrieves the currency info for a given country, falling back to USD.
 */
export function getCurrencyForCountry(countryName?: string): CurrencyInfo {
  if (!countryName) return SUPPORTED_CURRENCIES.USD;
  
  const trimmed = countryName.trim();
  const directMatch = COUNTRY_TO_CURRENCY_MAP[trimmed];
  if (directMatch && SUPPORTED_CURRENCIES[directMatch]) {
    return SUPPORTED_CURRENCIES[directMatch];
  }

  // Partial match search
  const foundKey = Object.keys(COUNTRY_TO_CURRENCY_MAP).find(c =>
    trimmed.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(trimmed.toLowerCase())
  );

  if (foundKey && COUNTRY_TO_CURRENCY_MAP[foundKey]) {
    const code = COUNTRY_TO_CURRENCY_MAP[foundKey];
    if (SUPPORTED_CURRENCIES[code]) {
      return SUPPORTED_CURRENCIES[code];
    }
  }

  return SUPPORTED_CURRENCIES.USD;
}

/**
 * Infer regional currency from browser timeZone as a fast offline fallback
 */
export function inferCurrencyFromTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Lagos') || tz.includes('Nigeria')) return 'NGN';
    if (tz.includes('London')) return 'GBP';
    if (tz.includes('Europe/')) return 'EUR';
    if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Winnipeg')) return 'CAD';
    if (tz.includes('Australia/')) return 'AUD';
    if (tz.includes('Accra')) return 'GHS';
    if (tz.includes('Nairobi')) return 'KES';
    if (tz.includes('Johannesburg')) return 'ZAR';
    if (tz.includes('Kolkata') || tz.includes('Calcutta')) return 'INR';
    if (tz.includes('Dubai')) return 'AED';
    if (tz.includes('Sao_Paulo')) return 'BRL';
    if (tz.includes('Mexico_City')) return 'MXN';
    if (tz.includes('Tokyo')) return 'JPY';
    if (tz.includes('America/')) return 'USD';
  } catch {
    // ignore
  }
  return 'USD';
}

export interface ResolvedCurrencyResult {
  code: string;
  source: 'profile' | 'override' | 'ip' | 'timezone' | 'default';
  countryName?: string;
  label: string;
}

/**
 * Resolves user's active display currency according to profile settings, IP / location, or explicit user override.
 */
export function resolveUserDefaultCurrency(userProfile?: { country?: string } | null): ResolvedCurrencyResult {
  // 1. Explicit user selection override in localStorage
  if (typeof window !== 'undefined') {
    const savedOverride = localStorage.getItem('rentora_user_currency');
    if (savedOverride && SUPPORTED_CURRENCIES[savedOverride]) {
      return { 
        code: savedOverride, 
        source: 'override', 
        label: `User Selected (${savedOverride})` 
      };
    }
  }

  // 2. Profile Settings Detection
  if (userProfile?.country) {
    const curr = getCurrencyForCountry(userProfile.country);
    if (curr && curr.code) {
      return { 
        code: curr.code, 
        source: 'profile', 
        countryName: userProfile.country,
        label: `Profile: ${userProfile.country} (${curr.code})`
      };
    }
  }

  // 3. TimeZone / Browser locale fallback
  const tzCode = inferCurrencyFromTimeZone();
  return { 
    code: tzCode, 
    source: 'timezone',
    label: `Local Timezone (${tzCode})` 
  };
}

/**
 * Async IP-based location and currency detection with tight timeout
 */
export async function detectIPCurrency(): Promise<{ code: string; country?: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.currency && SUPPORTED_CURRENCIES[data.currency]) {
        return { code: data.currency, country: data.country_name };
      }
      if (data && data.country_name) {
        const mapped = getCurrencyForCountry(data.country_name);
        if (mapped) return { code: mapped.code, country: data.country_name };
      }
    }
  } catch {
    // Fail silently to fallback
  }
  return null;
}

/**
 * Converts a price in USD to target currency amount
 */
export function convertUSDToCurrency(amountInUSD: number, currencyCode: string): number {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  return Math.round(amountInUSD * currency.rateToUSD);
}

/**
 * Converts a price in local currency to USD amount
 */
export function convertCurrencyToUSD(amountInLocalCurrency: number, currencyCode: string): number {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  if (currency.rateToUSD === 0) return amountInLocalCurrency;
  return Math.round(amountInLocalCurrency / currency.rateToUSD);
}

/**
 * Formats a currency amount into a clean localized string with proper symbols and number formatting
 */
export function formatCurrencyAmount(
  amount: number, 
  currencyCode: string = 'USD', 
  options?: { compact?: boolean; hideDecimals?: boolean }
): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  const hideDec = options?.hideDecimals ?? true;

  if (options?.compact && amount >= 1000000) {
    return `${currency.symbol}${(amount / 1000000).toFixed(1)}M`;
  }
  if (options?.compact && amount >= 10000) {
    return `${currency.symbol}${(amount / 1000).toFixed(1)}k`;
  }

  const formattedNum = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: hideDec ? 0 : 2,
    minimumFractionDigits: hideDec ? 0 : 2,
  }).format(amount);

  return `${currency.symbol}${formattedNum}`;
}

/**
 * Resolves full pricing info for a property listing:
 * Returns both the local regional price/currency and the universal USD price.
 */
export function getListingPrices(
  listing: {
    price: number; // Stored baseline price in USD or local
    currency?: string;
    localPrice?: number;
    country?: string;
    location?: string;
  },
  globalDisplayCurrencyMode: string = 'regional' // 'regional' | 'auto' | 'USD' | 'NGN' | 'EUR' | 'GBP' ...
) {
  // Determine listing's native regional currency
  let nativeCurrencyCode = listing.currency;
  if (!nativeCurrencyCode) {
    if (listing.country) {
      nativeCurrencyCode = getCurrencyForCountry(listing.country).code;
    } else if (listing.location) {
      const foundCountry = Object.keys(COUNTRY_TO_CURRENCY_MAP).find(c =>
        listing.location?.toLowerCase().includes(c.toLowerCase())
      );
      nativeCurrencyCode = foundCountry ? COUNTRY_TO_CURRENCY_MAP[foundCountry] : 'USD';
    } else {
      nativeCurrencyCode = 'USD';
    }
  }

  const nativeCurrency = SUPPORTED_CURRENCIES[nativeCurrencyCode] || SUPPORTED_CURRENCIES.USD;

  // Determine baseline USD price and native local price
  let priceInUSD: number;
  let localPrice: number;

  if (listing.localPrice && listing.currency) {
    localPrice = listing.localPrice;
    priceInUSD = listing.price || convertCurrencyToUSD(localPrice, listing.currency);
  } else {
    priceInUSD = listing.price || 0;
    localPrice = convertUSDToCurrency(priceInUSD, nativeCurrencyCode);
  }

  let primaryFormatted: string;
  let secondaryFormatted: string | null = null;
  let primaryCode: string = nativeCurrencyCode;

  if (globalDisplayCurrencyMode === 'regional') {
    // Show listing's native currency as primary, and USD as secondary fallback if native != USD
    primaryFormatted = formatCurrencyAmount(localPrice, nativeCurrencyCode);
    primaryCode = nativeCurrencyCode;

    if (nativeCurrencyCode !== 'USD') {
      secondaryFormatted = `~${formatCurrencyAmount(priceInUSD, 'USD')} USD`;
    }
  } else {
    // User or system picked a display currency (e.g. 'EUR', 'NGN', 'GBP', 'USD', 'CAD', etc.)
    const targetCurrencyCode = globalDisplayCurrencyMode;
    const targetAmount = convertUSDToCurrency(priceInUSD, targetCurrencyCode);
    primaryFormatted = formatCurrencyAmount(targetAmount, targetCurrencyCode);
    primaryCode = targetCurrencyCode;

    if (targetCurrencyCode !== nativeCurrencyCode) {
      if (targetCurrencyCode !== 'USD' && nativeCurrencyCode !== 'USD') {
        secondaryFormatted = `~${formatCurrencyAmount(priceInUSD, 'USD')} USD (${formatCurrencyAmount(localPrice, nativeCurrencyCode)} native)`;
      } else if (targetCurrencyCode !== 'USD') {
        secondaryFormatted = `~${formatCurrencyAmount(priceInUSD, 'USD')} USD`;
      } else {
        secondaryFormatted = `(${formatCurrencyAmount(localPrice, nativeCurrencyCode)} native)`;
      }
    } else if (nativeCurrencyCode !== 'USD') {
      secondaryFormatted = `~${formatCurrencyAmount(priceInUSD, 'USD')} USD`;
    }
  }

  return {
    priceUSD: priceInUSD,
    localPrice,
    nativeCurrency,
    nativeCurrencyCode,
    primaryFormatted,
    secondaryFormatted,
    primaryCode,
  };
}


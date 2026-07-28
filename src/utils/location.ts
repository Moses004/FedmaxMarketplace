export interface CountryData {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  majorStates: string[];
  popularCities: string[];
}

export const GLOBAL_COUNTRIES: CountryData[] = [
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    phoneCode: '+34',
    majorStates: ['Community of Madrid', 'Catalonia', 'Andalusia', 'Valencian Community', 'Basque Country', 'Galicia'],
    popularCities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Malaga', 'Bilbao', 'Zaragoza', 'Alicante']
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    phoneCode: '+234',
    majorStates: ['Lagos State', 'Federal Capital Territory (Abuja)', 'Rivers State', 'Oyo State', 'Kano State', 'Enugu State', 'Anambra State'],
    popularCities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Asaba', 'Abeokuta']
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    phoneCode: '+44',
    majorStates: ['Greater London', 'Greater Manchester', 'West Midlands', 'Scotland', 'Wales', 'Northern Ireland'],
    popularCities: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Bristol', 'Leeds', 'Liverpool']
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    phoneCode: '+49',
    majorStates: ['Berlin', 'Bavaria', 'North Rhine-Westphalia', 'Baden-Württemberg', 'Hesse', 'Hamburg'],
    popularCities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Düsseldorf', 'Stuttgart']
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    phoneCode: '+1',
    majorStates: ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Massachusetts'],
    popularCities: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Austin', 'San Francisco', 'Seattle', 'Boston']
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    phoneCode: '+33',
    majorStates: ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Occitanie'],
    popularCities: ['Paris', 'Lyon', 'Marseille', 'Nice', 'Toulouse', 'Bordeaux', 'Lille']
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    phoneCode: '+1',
    majorStates: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Nova Scotia'],
    popularCities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton']
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    phoneCode: '+39',
    majorStates: ['Lazio', 'Lombardy', 'Tuscany', 'Veneto', 'Campania', 'Piedmont'],
    popularCities: ['Rome', 'Milan', 'Florence', 'Venice', 'Naples', 'Turin', 'Bologna']
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    phoneCode: '+31',
    majorStates: ['North Holland', 'South Holland', 'Utrecht', 'North Brabant'],
    popularCities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven']
  },
  {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    phoneCode: '+351',
    majorStates: ['Lisbon District', 'Porto District', 'Faro (Algarve)', 'Braga'],
    popularCities: ['Lisbon', 'Porto', 'Faro', 'Braga', 'Coimbra']
  },
  {
    code: 'IE',
    name: 'Ireland',
    flag: '🇮🇪',
    phoneCode: '+353',
    majorStates: ['County Dublin', 'County Cork', 'County Galway', 'County Limerick'],
    popularCities: ['Dublin', 'Cork', 'Galway', 'Limerick']
  },
  {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    phoneCode: '+233',
    majorStates: ['Greater Accra', 'Ashanti Region', 'Central Region', 'Western Region'],
    popularCities: ['Accra', 'Kumasi', 'Cape Coast', 'Takoradi', 'Tema']
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    phoneCode: '+254',
    majorStates: ['Nairobi County', 'Mombasa County', 'Nakuru County', 'Kisumu County'],
    popularCities: ['Nairobi', 'Mombasa', 'Nakuru', 'Kisumu', 'Eldoret']
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    phoneCode: '+27',
    majorStates: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'],
    popularCities: ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Gqeberha']
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    phoneCode: '+971',
    majorStates: ['Dubai', 'Abu Dhabi', 'Sharjah'],
    popularCities: ['Dubai', 'Abu Dhabi', 'Sharjah']
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    phoneCode: '+61',
    majorStates: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia'],
    popularCities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide']
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    phoneCode: '+91',
    majorStates: ['Maharashtra', 'Karnataka', 'Delhi NCT', 'Tamil Nadu', 'Telangana'],
    popularCities: ['Mumbai', 'Bengaluru', 'New Delhi', 'Chennai', 'Hyderabad', 'Pune']
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    phoneCode: '+55',
    majorStates: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia'],
    popularCities: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília']
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    phoneCode: '+52',
    majorStates: ['Mexico City', 'Jalisco', 'Nuevo León', 'Quintana Roo'],
    popularCities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Cancún', 'Puebla']
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    phoneCode: '+81',
    majorStates: ['Tokyo Metropolis', 'Osaka Prefecture', 'Kyoto Prefecture', 'Kanagawa'],
    popularCities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Fukuoka']
  }
];

/**
 * Filter countries by search term
 */
export function searchCountries(query: string): CountryData[] {
  if (!query || !query.trim()) return GLOBAL_COUNTRIES;
  const q = query.trim().toLowerCase();
  return GLOBAL_COUNTRIES.filter(
    c => c.name.toLowerCase().includes(q) ||
         c.code.toLowerCase().includes(q) ||
         c.phoneCode.includes(q)
  );
}

/**
 * Dynamically return market options based on selected country
 */
export function getDynamicMarketsForCountry(selectedCountryName: string): { label: string; value: string; flag: string; isLaunchRegion: boolean }[] {
  const result: { label: string; value: string; flag: string; isLaunchRegion: boolean }[] = [];

  // Match launch regions for this country first
  LAUNCH_REGIONS.forEach(r => {
    if (r.country.toLowerCase() === selectedCountryName.toLowerCase() || selectedCountryName === 'All' || !selectedCountryName) {
      result.push({
        label: `${r.name}, ${r.country}`,
        value: `${r.name}, ${r.country}`,
        flag: r.flag,
        isLaunchRegion: true
      });
    }
  });

  // Also include popular cities from country data
  const countryObj = GLOBAL_COUNTRIES.find(c => c.name.toLowerCase() === selectedCountryName.toLowerCase());
  if (countryObj) {
    countryObj.popularCities.forEach(city => {
      const existing = result.find(r => r.value.toLowerCase().includes(city.toLowerCase()));
      if (!existing) {
        result.push({
          label: `${city}, ${countryObj.name}`,
          value: `${city}, ${countryObj.name}`,
          flag: countryObj.flag,
          isLaunchRegion: false
        });
      }
    });
  }

  // If no specific country matched, provide global launch regions & top hubs
  if (result.length === 0) {
    LAUNCH_REGIONS.forEach(r => {
      result.push({
        label: `${r.name}, ${r.country}`,
        value: `${r.name}, ${r.country}`,
        flag: r.flag,
        isLaunchRegion: true
      });
    });
  }

  return result;
}

export interface LaunchRegion {
  id: string;
  name: string;
  country: string;
  flag: string;
  center: { lat: number; lng: number };
  zoom: number;
  popularNeighborhoods: string[];
}

export const LAUNCH_REGIONS: LaunchRegion[] = [
  {
    id: 'madrid',
    name: 'Madrid',
    country: 'Spain',
    flag: '🇪🇸',
    center: { lat: 40.4167, lng: -3.7037 },
    zoom: 13,
    popularNeighborhoods: ['Plaza Mayor', 'Sol', 'Salamanca', 'Malasaña', 'Chamberí', 'Retiro', 'Chueca']
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    flag: '🇪🇸',
    center: { lat: 41.3851, lng: 2.1734 },
    zoom: 13,
    popularNeighborhoods: ['Eixample', 'Barceloneta', 'Gràcia', 'El Born', 'Gòtic', 'Poble-Sec', 'Sant Martí']
  },
  {
    id: 'valencia',
    name: 'Valencia',
    country: 'Spain',
    flag: '🇪🇸',
    center: { lat: 39.4699, lng: -0.3763 },
    zoom: 13,
    popularNeighborhoods: ['Ruzafa', 'El Carmen', 'Ciutat Vella', 'Eshampla', 'Algirós', 'El Cabanyal']
  },
  {
    id: 'seville',
    name: 'Seville',
    country: 'Spain',
    flag: '🇪🇸',
    center: { lat: 37.3891, lng: -5.9845 },
    zoom: 13,
    popularNeighborhoods: ['Santa Cruz', 'Triana', 'Macarena', 'Nervión', 'Alameda de Hércules']
  },
  {
    id: 'lagos',
    name: 'Lagos',
    country: 'Nigeria',
    flag: '🇳🇬',
    center: { lat: 6.5244, lng: 3.3792 },
    zoom: 12,
    popularNeighborhoods: ['Victoria Island', 'IkoYi', 'Lekki Phase 1', 'Ikeja GRA', 'Surulere', 'Yaba']
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    center: { lat: 51.5074, lng: -0.1278 },
    zoom: 12,
    popularNeighborhoods: ['Shoreditch', 'Kensington', 'Camden', 'Soho', 'Greenwich', 'Chelsea']
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    flag: '🇩🇪',
    center: { lat: 52.5200, lng: 13.4050 },
    zoom: 12,
    popularNeighborhoods: ['Mitte', 'Kreuzberg', 'Neukölln', 'Prenzlauer Berg', 'Friedrichshain']
  }
];

/**
 * Calculates straight-line geodesic distance between two points in kilometers (Haversine Formula)
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export interface GeocodedAddress {
  formattedAddress: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

/**
 * Perform address autocomplete or geocoding search via Nominatim API with instant local fallback
 */
export async function searchAddressSuggestions(query: string): Promise<GeocodedAddress[]> {
  if (!query || query.trim().length < 2) return [];

  const trimmed = query.trim().toLowerCase();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5&addressdetails=1`,
      {
        headers: { 'User-Agent': 'RentoraRealEstateApp/1.0' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          formattedAddress: item.display_name,
          city: item.address?.city || item.address?.town || item.address?.suburb || item.address?.state || 'Unknown City',
          country: item.address?.country || '',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
      }
    }
  } catch (err) {
    // Network error or timeout, proceed to local smart matching
  }

  // Fallback preset suggestions if offline or search timeout
  const matchingRegions = LAUNCH_REGIONS.filter(
    r => r.name.toLowerCase().includes(trimmed) || r.country.toLowerCase().includes(trimmed) || r.popularNeighborhoods.some(n => n.toLowerCase().includes(trimmed))
  );

  if (matchingRegions.length > 0) {
    return matchingRegions.map(r => ({
      formattedAddress: `${r.name}, ${r.country}`,
      city: r.name,
      country: r.country,
      lat: r.center.lat,
      lng: r.center.lng
    }));
  }

  return [];
}

/**
 * Get current user GPS location using Browser Geolocation API
 */
export function getCurrentUserCoordinates(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

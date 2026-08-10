import { Listing } from '../types';

export interface SEOMetadataOptions {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'place' | 'product';
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = "Rentora RealEstate | Verified Property Rentals & Marketplace";
const DEFAULT_DESCRIPTION = "Rentora RealEstate connects verified tenants and landlords across Europe and globally. Find luxury apartments, long-term rentals, studio flats, and verified homes with instant online lease verification and direct payouts.";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80";
const SITE_NAME = "Rentora RealEstate";

/**
 * Helper to update meta tag content or create it if missing
 */
function setMetaTag(attrName: string, attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Helper to update link tag href or create it if missing
 */
function setLinkTag(rel: string, href: string) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * Inject or update JSON-LD structured data script tag
 */
function setJsonLdScript(data: Record<string, any> | Array<Record<string, any>> | null) {
  if (typeof document === 'undefined') return;
  const scriptId = 'rentora-dynamic-jsonld';
  let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!data) {
    if (scriptTag) scriptTag.remove();
    return;
  }

  if (!scriptTag) {
    scriptTag = document.createElement('script');
    scriptTag.id = scriptId;
    scriptTag.type = 'application/ld+json';
    document.head.appendChild(scriptTag);
  }

  scriptTag.text = JSON.stringify(data, null, 2);
}

/**
 * Main Centralized SEO Metadata Updater Function
 */
export function updateSEOMetadata(options: SEOMetadataOptions) {
  if (typeof document === 'undefined') return;

  const title = options.title ? `${options.title}` : DEFAULT_TITLE;
  const description = options.description || DEFAULT_DESCRIPTION;
  const image = options.ogImage || DEFAULT_IMAGE;
  const canonicalUrl = options.canonicalUrl || (typeof window !== 'undefined' ? window.location.href : 'https://rentora-realestate.com');
  const ogType = options.ogType || 'website';
  const twitterCard = options.twitterCard || 'summary_large_image';

  // 1. Document Title
  document.title = title;

  // 2. Primary Meta Tags
  setMetaTag('name', 'title', title);
  setMetaTag('name', 'description', description);
  if (options.keywords) {
    setMetaTag('name', 'keywords', options.keywords);
  }

  // 3. OpenGraph Tags
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:image', image);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:type', ogType);
  setMetaTag('property', 'og:site_name', SITE_NAME);

  // 4. Twitter Card Tags
  setMetaTag('property', 'twitter:card', twitterCard);
  setMetaTag('property', 'twitter:title', title);
  setMetaTag('property', 'twitter:description', description);
  setMetaTag('property', 'twitter:image', image);

  // 5. Canonical Link
  setLinkTag('canonical', canonicalUrl);

  // 6. JSON-LD Structured Data
  if (options.jsonLd) {
    setJsonLdScript(options.jsonLd);
  } else {
    // Default WebSite Schema
    setJsonLdScript({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': SITE_NAME,
      'url': canonicalUrl,
      'description': description,
    });
  }
}

/**
 * Generate SEO metadata specifically for a Single Property Listing
 */
export function buildListingSEOMetadata(listing: Listing, currencySymbol: string = '$'): SEOMetadataOptions {
  const priceFormatted = `${currencySymbol}${listing.price.toLocaleString()}/${listing.pricePeriod || 'mo'}`;
  const bedroomsLabel = listing.bedrooms > 0 ? `${listing.bedrooms} Bed ` : '';
  const bathroomsLabel = listing.bathrooms > 0 ? `${listing.bathrooms} Bath ` : '';
  
  const title = `${listing.title} (${priceFormatted}) — Rentora RealEstate`;
  const description = `${bedroomsLabel}${bathroomsLabel}${listing.type.toUpperCase()} available for rent in ${listing.location}. ${listing.description.slice(0, 140)}... Rent directly from verified landlords on Rentora.`;
  const primaryImage = listing.images && listing.images.length > 0 ? listing.images[0] : DEFAULT_IMAGE;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateListing',
        '@id': `#listing-${listing.id}`,
        'name': listing.title,
        'description': listing.description,
        'image': listing.images,
        'datePosted': listing.availableFrom || '2026-08-01',
        'offers': {
          '@type': 'Offer',
          'price': listing.price,
          'priceCurrency': listing.currency || 'USD',
          'availability': listing.status === 'rented' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          'validFrom': listing.availableFrom || '2026-08-01',
        },
        'itemOffered': {
          '@type': listing.type === 'office-commercial' ? 'Place' : 'Accommodation',
          'name': listing.title,
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': listing.city || listing.location,
            'addressRegion': listing.state || '',
            'addressCountry': listing.country || ''
          },
          'geo': {
            '@type': 'GeoCoordinates',
            'latitude': listing.lat,
            'longitude': listing.lng
          },
          'numberOfRooms': listing.bedrooms,
          'floorSize': {
            '@type': 'QuantitativeValue',
            'value': listing.size,
            'unitCode': 'MTK'
          },
          'amenityFeature': listing.amenities?.map(a => ({
            '@type': 'LocationFeatureSpecification',
            'name': a,
            'value': true
          }))
        }
      }
    ]
  };

  return {
    title,
    description,
    keywords: `${listing.title}, ${listing.type} rent, ${listing.city || listing.location} rentals, Rentora property ${listing.id}`,
    ogType: 'place',
    ogImage: primaryImage,
    twitterCard: 'summary_large_image',
    jsonLd
  };
}

/**
 * Generate SEO metadata for Search & Filter Results View
 */
export function buildSearchSEOMetadata(params: {
  resultCount: number;
  searchQuery?: string;
  categoryLabel?: string;
  locationName?: string;
  topListings?: Listing[];
  currencySymbol?: string;
}): SEOMetadataOptions {
  const { resultCount, searchQuery, categoryLabel, locationName, topListings, currencySymbol = '$' } = params;

  let titleParts: string[] = [];
  if (categoryLabel && categoryLabel !== 'All Categories' && categoryLabel !== 'all') {
    titleParts.push(categoryLabel);
  } else {
    titleParts.push('Property Rentals');
  }

  if (locationName && locationName !== 'Global' && locationName !== 'all') {
    titleParts.push(`in ${locationName}`);
  }

  if (searchQuery && searchQuery.trim()) {
    titleParts.push(`matching "${searchQuery.trim()}"`);
  }

  const categoryTitle = titleParts.join(' ');
  const title = `${resultCount > 0 ? `${resultCount} Verified ` : ''}${categoryTitle} | Rentora RealEstate`;

  const description = resultCount > 0
    ? `Explore ${resultCount} verified property rentals ${locationName ? `in ${locationName}` : 'worldwide'} on Rentora. Compare prices, interactive map locations, virtual video tours, and verified landlord contact options.`
    : `Search verified long-term rentals, apartments, studios, and commercial spaces on Rentora RealEstate marketplace.`;

  // Build ItemList JSON-LD Schema
  let jsonLd: Record<string, any> | undefined = undefined;
  if (topListings && topListings.length > 0) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      'name': title,
      'description': description,
      'mainEntity': {
        '@type': 'ItemList',
        'numberOfItems': topListings.length,
        'itemListElement': topListings.slice(0, 8).map((item, index) => ({
          '@type': 'ListItem',
          'position': index + 1,
          'item': {
            '@type': 'RealEstateListing',
            'name': item.title,
            'url': `${typeof window !== 'undefined' ? window.location.origin : ''}/?listing=${item.id}`,
            'description': item.description,
            'image': item.images?.[0] || DEFAULT_IMAGE,
            'offers': {
              '@type': 'Offer',
              'price': item.price,
              'priceCurrency': item.currency || 'USD'
            }
          }
        }))
      }
    };
  }

  return {
    title,
    description,
    keywords: `Rentora rentals, ${categoryTitle}, property search, long term leases`,
    ogType: 'website',
    ogImage: topListings?.[0]?.images?.[0] || DEFAULT_IMAGE,
    twitterCard: 'summary_large_image',
    jsonLd
  };
}

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.SITE_URL || 'https://rentora-realestate.com';
const TODAY = new Date().toISOString().split('T')[0];

// Key core pages with priority & change frequency
const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/?tab=explore', priority: '0.9', changefreq: 'daily' },
  { url: '/?category=apartment', priority: '0.8', changefreq: 'weekly' },
  { url: '/?category=luxury-villa', priority: '0.8', changefreq: 'weekly' },
  { url: '/?category=studio-flat', priority: '0.8', changefreq: 'weekly' },
  { url: '/?category=room-share', priority: '0.8', changefreq: 'weekly' },
  { url: '/?category=penthouse', priority: '0.8', changefreq: 'weekly' },
  { url: '/?region=madrid', priority: '0.85', changefreq: 'daily' },
  { url: '/?region=barcelona', priority: '0.85', changefreq: 'daily' },
  { url: '/?region=valencia', priority: '0.8', changefreq: 'weekly' },
  { url: '/?region=lagos', priority: '0.8', changefreq: 'weekly' },
  { url: '/?region=london', priority: '0.8', changefreq: 'weekly' },
  { url: '/?tab=favorites', priority: '0.5', changefreq: 'weekly' },
  { url: '/?tab=dashboard', priority: '0.6', changefreq: 'monthly' },
  { url: '/?tab=my-bookings', priority: '0.6', changefreq: 'monthly' },
  { url: '/?tab=saved-searches', priority: '0.6', changefreq: 'monthly' },
];

// Sample featured property listings for indexing
const featuredListings = [
  {
    id: 'listing-1',
    title: 'Luxury Salamanca Penthouse with Private Terrace',
    price: 2450,
    type: 'Penthouse',
    location: 'Salamanca, Madrid',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'listing-2',
    title: 'Modern Eixample Apartment near Sagrada Familia',
    price: 1850,
    type: 'Apartment',
    location: 'Eixample, Barcelona',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'listing-3',
    title: 'Charming Old Town Studio in Ruzafa',
    price: 950,
    type: 'Studio',
    location: 'Ruzafa, Valencia',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'listing-4',
    title: 'Executive Waterfront Residence in Ikoyi',
    price: 3200,
    type: 'Luxury Villa',
    location: 'Ikoyi, Lagos',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'listing-5',
    title: 'Contemporary Studio Flat near Kensington Park',
    price: 1950,
    type: 'Studio',
    location: 'Kensington, London',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
  }
];

function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSitemapXml() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // 1. Static Pages & Categories
  staticPages.forEach(page => {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(`${BASE_URL}${page.url}`)}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  // 2. Individual Property Listing Pages
  featuredListings.forEach(item => {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(`${BASE_URL}/?listing=${item.id}`)}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `    <image:image>\n`;
    xml += `      <image:loc>${escapeXml(item.image)}</image:loc>\n`;
    xml += `      <image:title>${escapeXml(item.title)} - Rentora RealEstate</image:title>\n`;
    xml += `      <image:caption>${escapeXml(`Verified ${item.type} in ${item.location} for €${item.price}/month`)}</image:caption>\n`;
    xml += `    </image:image>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
}

function main() {
  console.log('[Sitemap Generator] Generating sitemap.xml...');
  const xmlContent = generateSitemapXml();

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, xmlContent, 'utf8');
  console.log(`[Sitemap Generator] Successfully generated sitemap at ${sitemapPath}`);

  // If dist directory exists, write to dist/sitemap.xml as well
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xmlContent, 'utf8');
    console.log(`[Sitemap Generator] Copied sitemap to dist/sitemap.xml`);
  }
}

main();

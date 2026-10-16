import { CakeProduct, BUSINESS_CONFIG } from '../data/bakeryData.ts';

// Default bakery metadata for Sweet Bliss by Jyoti Tanti
export const DEFAULT_SEO_CONFIG = {
  title: 'Sweet Bliss by Jyoti Tanti – Artisan Bakery & Cakes Bangalore',
  description:
    'Artisan celebration cakes, pastries, custom designs, and AI cake recommendations handcrafted by Chef Jyoti Tanti in Bangalore (562162). 100% Eggless available with free delivery.',
  siteName: 'Sweet Bliss by Jyoti Tanti',
  siteUrl: typeof window !== 'undefined' ? window.location.origin : 'https://sweetblissbakery.com',
  image: '/src/assets/images/hero_celebration_cake_1791732956087.jpg',
  keywords:
    'bakery in Bangalore, cake shop Bangalore, Jyoti Tanti cakes, eggless cakes Bangalore 562162, birthday cakes, designer cakes, custom wedding cakes, artisan pastries, free cake delivery Bangalore',
};

/**
 * Helper to update or create a <meta> tag by name or property attribute.
 */
function setMetaTag(attributeName: 'name' | 'property', attributeValue: string, content: string) {
  let element = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Helper to remove a <meta> tag if it exists.
 */
function removeMetaTag(attributeName: 'name' | 'property', attributeValue: string) {
  const element = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Helper to set or update the canonical link tag.
 */
function setCanonicalUrl(url: string) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Helper to inject or update Schema.org JSON-LD structured data.
 */
function setJsonLd(id: string, data: object | null) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!data) {
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data, null, 2);
}

/**
 * Builds the LocalBusiness / Bakery JSON-LD schema for default view.
 */
export function getBakeryStructuredData() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sweetblissbakery.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: BUSINESS_CONFIG.name,
    image: `${origin}/src/assets/images/hero_celebration_cake_1791732956087.jpg`,
    '@id': `${origin}/#bakery`,
    url: origin,
    telephone: `+91${BUSINESS_CONFIG.phone}`,
    priceRange: '₹₹',
    founder: {
      '@type': 'Person',
      name: BUSINESS_CONFIG.ownerName,
      jobTitle: 'Master Artisan Pastry Chef',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Chandapura - Anekal Road',
      addressLocality: 'Bangalore',
      addressRegion: 'Karnataka',
      postalCode: BUSINESS_CONFIG.pincode,
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 12.7933,
      longitude: 77.6989,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '09:00',
        closes: '23:30',
      },
    ],
    servesCuisine: ['Bakery', 'Desserts', 'Custom Cakes', 'Eggless Patisserie'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Artisan Cakes & Pastries Menu',
    },
  };
}

/**
 * Dynamically updates document title, standard meta tags, OpenGraph tags,
 * Twitter cards, and Schema.org Product structured data based on the selected cake.
 *
 * When cake is null, gracefully resets all metadata to Jyoti Tanti's bakery defaults.
 */
export function updateProductMetaTags(product: CakeProduct | null): void {
  if (typeof document === 'undefined') return;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  if (product) {
    // 1. Dynamic Page Title
    const formattedTitle = `${product.name} – ₹${product.price} | Sweet Bliss by Jyoti Tanti Bangalore`;
    document.title = formattedTitle;

    // 2. Dynamic Meta Description (optimized between 130-160 characters with call to action)
    const egglessNote = product.isEggless ? '100% Eggless.' : 'Freshly baked.';
    const flavorText = product.flavours && product.flavours.length > 0 ? ` Flavours: ${product.flavours.slice(0, 2).join(', ')}.` : '';
    const formattedDesc = `Order handcrafted ${product.name} (₹${product.price}) from Chef Jyoti Tanti's bakery in Bangalore (562162). ${egglessNote}${flavorText} Free same-day delivery!`;

    setMetaTag('name', 'description', formattedDesc);
    setMetaTag('name', 'keywords', `${product.name}, ${product.categoryLabel}, cake Bangalore, eggless ${product.name}, order cake Bangalore 562162, Jyoti Tanti bakery`);

    // 3. Canonical URL
    const canonicalUrl = `${origin}${pathname}?product=${encodeURIComponent(product.id)}`;
    setCanonicalUrl(canonicalUrl);

    // 4. Resolve absolute image URL
    let absoluteImageUrl = product.image;
    if (product.image && !product.image.startsWith('http')) {
      absoluteImageUrl = `${origin}${product.image.startsWith('/') ? '' : '/'}${product.image}`;
    }

    // 5. OpenGraph Tags
    setMetaTag('property', 'og:title', `${product.name} | Sweet Bliss by Jyoti Tanti`);
    setMetaTag('property', 'og:description', formattedDesc);
    setMetaTag('property', 'og:type', 'product');
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', absoluteImageUrl);
    setMetaTag('property', 'og:image:alt', `${product.name} handcrafted by Jyoti Tanti`);
    setMetaTag('property', 'og:site_name', BUSINESS_CONFIG.name);

    // E-commerce OpenGraph product specifics
    setMetaTag('property', 'product:price:amount', String(product.price));
    setMetaTag('property', 'product:price:currency', 'INR');
    setMetaTag('property', 'product:availability', product.inStock !== false ? 'in stock' : 'out of stock');
    setMetaTag('property', 'product:condition', 'new');
    setMetaTag('property', 'product:brand', BUSINESS_CONFIG.name);
    setMetaTag('property', 'product:retailer_item_id', product.id);

    // 6. Twitter / X Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', `${product.name} – ₹${product.price} | Sweet Bliss`);
    setMetaTag('name', 'twitter:description', formattedDesc);
    setMetaTag('name', 'twitter:image', absoluteImageUrl);
    setMetaTag('name', 'twitter:image:alt', `${product.name} by Jyoti Tanti`);

    // 7. Schema.org Product JSON-LD
    const productJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: [absoluteImageUrl],
      description: product.description || formattedDesc,
      sku: product.id,
      mpn: `SB-${product.id.toUpperCase()}`,
      brand: {
        '@type': 'Brand',
        name: BUSINESS_CONFIG.name,
      },
      category: product.categoryLabel || product.category,
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'INR',
        price: product.price,
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Bakery',
          name: BUSINESS_CONFIG.name,
          telephone: `+91${BUSINESS_CONFIG.phone}`,
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Chandapura - Anekal Road',
            addressLocality: 'Bangalore',
            addressRegion: 'Karnataka',
            postalCode: BUSINESS_CONFIG.pincode,
            addressCountry: 'IN',
          },
        },
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating || 4.9,
        reviewCount: product.reviewsCount || 45,
        bestRating: 5,
        worstRating: 1,
      },
    };

    setJsonLd('sb-product-schema', productJsonLd);
  } else {
    // Reset to default bakery metadata
    document.title = DEFAULT_SEO_CONFIG.title;
    setMetaTag('name', 'description', DEFAULT_SEO_CONFIG.description);
    setMetaTag('name', 'keywords', DEFAULT_SEO_CONFIG.keywords);

    const defaultCanonicalUrl = `${origin}${pathname}`;
    setCanonicalUrl(defaultCanonicalUrl);

    let defaultImage = DEFAULT_SEO_CONFIG.image;
    if (!defaultImage.startsWith('http')) {
      defaultImage = `${origin}${defaultImage.startsWith('/') ? '' : '/'}${defaultImage}`;
    }

    setMetaTag('property', 'og:title', DEFAULT_SEO_CONFIG.title);
    setMetaTag('property', 'og:description', DEFAULT_SEO_CONFIG.description);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:url', defaultCanonicalUrl);
    setMetaTag('property', 'og:image', defaultImage);
    setMetaTag('property', 'og:site_name', DEFAULT_SEO_CONFIG.siteName);

    // Clean up product-specific meta tags
    removeMetaTag('property', 'product:price:amount');
    removeMetaTag('property', 'product:price:currency');
    removeMetaTag('property', 'product:availability');
    removeMetaTag('property', 'product:condition');
    removeMetaTag('property', 'product:brand');
    removeMetaTag('property', 'product:retailer_item_id');

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', DEFAULT_SEO_CONFIG.title);
    setMetaTag('name', 'twitter:description', DEFAULT_SEO_CONFIG.description);
    setMetaTag('name', 'twitter:image', defaultImage);

    // Remove product schema and ensure bakery LocalBusiness schema is active
    setJsonLd('sb-product-schema', null);
    setJsonLd('sb-bakery-schema', getBakeryStructuredData());
  }
}

import { CakeProduct } from './bakeryData.ts';

export interface CustomerReview {
  id: string;
  productId: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  occasion: string;
  title: string;
  comment: string;
  purchasedSize?: string;
  helpfulCount: number;
  isVerified: boolean;
}

export const BASE_REVIEWS: Record<string, CustomerReview[]> = {
  'chocolate-truffle-cake': [
    {
      id: 'rev-ct-1',
      productId: 'chocolate-truffle-cake',
      author: 'Pooja Singhania',
      location: 'Electronic City, Bangalore',
      rating: 5,
      date: '2 days ago',
      occasion: "Husband's 30th Birthday",
      title: 'Absolute showstopper! Rich, moist and not overly sweet',
      comment: 'Ordered this for my husband’s birthday party and every single guest asked where it was from! The 55% Belgian chocolate ganache has that luxurious, melt-in-the-mouth silkiness. Arrived chilled and in perfect condition.',
      purchasedSize: '1 kg • Eggless Pure Veg',
      helpfulCount: 28,
      isVerified: true,
    },
    {
      id: 'rev-ct-2',
      productId: 'chocolate-truffle-cake',
      author: 'Arjun Venkatesh',
      location: 'Koramangala, Bangalore',
      rating: 5,
      date: '5 days ago',
      occasion: 'Anniversary Celebration',
      title: 'Fine patisserie craftsmanship & exquisite piping',
      comment: 'The chocolate curls and golden accents looked stunning on the celebration table. The sponge was cloud-soft and so moist despite being 100% eggless. Chef Jyoti Tanti has set a whole new benchmark for cakes in Bangalore.',
      purchasedSize: '1 kg',
      helpfulCount: 19,
      isVerified: true,
    },
    {
      id: 'rev-ct-3',
      productId: 'chocolate-truffle-cake',
      author: 'Dr. Ananya Reddy',
      location: 'Indiranagar, Bangalore',
      rating: 5,
      date: '1 week ago',
      occasion: 'Family Celebration',
      title: 'Pure indulgence without heavy chemical taste',
      comment: 'You can immediately tell they use real butter, pure cocoa and fresh cream instead of hydrogenated fats. It has that authentic European dark chocolate finish. Kids and elders devoured every crumb.',
      purchasedSize: '500 g',
      helpfulCount: 14,
      isVerified: true,
    },
    {
      id: 'rev-ct-4',
      productId: 'chocolate-truffle-cake',
      author: 'Karthik Varma',
      location: 'HSR Layout, Bangalore',
      rating: 4,
      date: '2 weeks ago',
      occasion: 'Office Milestone Event',
      title: 'Prompt same-day delivery, elegant presentation',
      comment: 'Ordered in the morning and it arrived right in time for our 4 PM team celebration. Sturdy packaging kept the cake completely safe. Very rich and decadent.',
      purchasedSize: '2 kg • Eggless',
      helpfulCount: 8,
      isVerified: true,
    },
  ],
  'red-velvet-cake': [
    {
      id: 'rev-rv-1',
      productId: 'red-velvet-cake',
      author: 'Meera Kulkarni',
      location: 'Whitefield, Bangalore',
      rating: 5,
      date: '3 days ago',
      occasion: 'Engagement Ceremony',
      title: 'Authentic Philadelphia cream cheese frosting!',
      comment: 'Most bakeries in the city use sweet buttercream and call it Red Velvet. Chef Jyoti Tanti actually uses real, slightly tangy cream cheese frosting which balances the cocoa crumb to perfection. Looks breathtaking in photos!',
      purchasedSize: '1 kg • Eggless',
      helpfulCount: 22,
      isVerified: true,
    },
    {
      id: 'rev-rv-2',
      productId: 'red-velvet-cake',
      author: 'Siddharth Rao',
      location: 'Chandapura, Bangalore (562162)',
      rating: 5,
      date: '6 days ago',
      occasion: 'Valentine Anniversary',
      title: 'Soft as velvet, genuinely fresh berries',
      comment: 'The crimson sponge texture was so light and airy. The message plaque was cleanly piped. My partner was thrilled. 10/10 recommendation!',
      purchasedSize: '500 g',
      helpfulCount: 16,
      isVerified: true,
    },
  ],
  'butterscotch-cake': [
    {
      id: 'rev-bs-1',
      productId: 'butterscotch-cake',
      author: 'Sunita Raman',
      location: 'Anekal, Bangalore',
      rating: 5,
      date: '4 days ago',
      occasion: "Son's 10th Birthday",
      title: 'The cashew praline crunch is addictive!',
      comment: 'Not an artificial sugary syrup cake like standard shops. This has genuine caramelized brown sugar toffee and generous crispy praline crunch between layers. The children were raving about it.',
      purchasedSize: '1 kg • Eggless',
      helpfulCount: 25,
      isVerified: true,
    },
  ],
};

// Realistic pool of customer feedback for any cake/pastry item
const GENERIC_REVIEWS_POOL = [
  {
    author: 'Neha Deshmukh',
    location: 'Electronic City, Bangalore',
    rating: 5,
    date: '3 days ago',
    occasion: 'Birthday Party',
    title: 'Exceeded all expectations in taste and presentation',
    comment: 'The freshness was unmistakable from the very first slice. Beautifully balanced sweetness, light sponge, and premium ingredients. Delivery arrived exactly on schedule in Bangalore.',
    helpfulCount: 21,
  },
  {
    author: 'Rohit Narayanan',
    location: 'Koramangala, Bangalore',
    rating: 5,
    date: '5 days ago',
    occasion: 'Weekend Family Celebration',
    title: 'Top notch patisserie quality right at home',
    comment: 'Ordered online after a friend’s recommendation. The cake was exceptionally moist and the finish was artistic. The packaging is premium and gifting-ready. Highly recommended!',
    helpfulCount: 15,
  },
  {
    author: 'Sneha & Tarun',
    location: 'Indiranagar, Bangalore',
    rating: 5,
    date: '1 week ago',
    occasion: 'Anniversary Dinner',
    title: 'Melt-in-mouth texture with authentic flavors',
    comment: 'Pure bliss in every bite! It wasn’t overwhelmingly heavy, just silky and deeply flavorful. Even our relatives who don’t usually eat cake asked for second servings.',
    helpfulCount: 18,
  },
  {
    author: 'Vikram Joshi',
    location: 'HSR Layout, Bangalore',
    rating: 4,
    date: '10 days ago',
    occasion: 'Office Celebration',
    title: 'Freshly baked and delivered chilled',
    comment: 'Great bakery experience from start to finish. The custom cake message was written with precision and the delivery partner was courteous. Will order again.',
    helpfulCount: 9,
  },
  {
    author: 'Divya Agarwal',
    location: 'Chandapura, Bangalore (562162)',
    rating: 5,
    date: '2 weeks ago',
    occasion: 'Kids Birthday Event',
    title: '100% Eggless yet surprisingly light and fluffy',
    comment: 'Finding genuine gourmet eggless cakes that aren’t dense can be tough. Chef Jyoti Tanti nailed it! Fluffy sponge and delightful cream.',
    helpfulCount: 14,
  },
];

/**
 * Returns all reviews for a product, combining pre-seeded reviews
 * with any user-submitted reviews saved in localStorage.
 */
export function getProductReviews(product: CakeProduct): CustomerReview[] {
  if (!product) return [];

  // 1. Check local storage for user-submitted reviews
  let localReviews: CustomerReview[] = [];
  try {
    const saved = localStorage.getItem(`sb_reviews_${product.id}`);
    if (saved) {
      localReviews = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load local reviews', e);
  }

  // 2. Base reviews specific to this product ID
  const specific = BASE_REVIEWS[product.id] || [];

  // 3. Fallback reviews dynamically adapted to this product if specific has fewer than 3
  const pool = GENERIC_REVIEWS_POOL.map((r, idx) => ({
    id: `rev-gen-${product.id}-${idx}`,
    productId: product.id,
    author: r.author,
    location: r.location,
    rating: r.rating,
    date: r.date,
    occasion: r.occasion,
    title: r.title,
    comment: r.comment.replace('cake', product.name),
    purchasedSize: product.sizes?.[0]?.label || 'Standard Unit',
    helpfulCount: r.helpfulCount,
    isVerified: true,
  }));

  const combined = [...localReviews, ...specific];
  if (combined.length < 4) {
    combined.push(...pool.slice(0, 4 - combined.length));
  }

  return combined;
}

/**
 * Saves a new review for a product to localStorage and returns updated list
 */
export function saveProductReview(product: CakeProduct, review: Omit<CustomerReview, 'id' | 'productId' | 'date' | 'helpfulCount' | 'isVerified'>): CustomerReview[] {
  const newReview: CustomerReview = {
    id: `rev-user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId: product.id,
    author: review.author.trim() || 'Sweet Bliss Patron',
    location: review.location?.trim() || 'Bangalore, Karnataka (562162)',
    rating: review.rating,
    date: 'Just now',
    occasion: review.occasion || 'Celebration',
    title: review.title.trim() || 'Delightful artisanal experience!',
    comment: review.comment.trim(),
    purchasedSize: review.purchasedSize,
    helpfulCount: 1,
    isVerified: true,
  };

  try {
    const key = `sb_reviews_${product.id}`;
    const existingRaw = localStorage.getItem(key);
    const existing: CustomerReview[] = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [newReview, ...existing];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save review to localStorage', e);
  }

  return getProductReviews(product);
}

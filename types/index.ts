export interface Store {
  id: string;
  name: string;
  category: string; // e.g., "Bakery", "Cafe", "Snack Bar", "Convenience"
  address: string;
  distanceKm: number;
  closingTime: string; // e.g., "21:00"
  imageUrl: string;
  latitude?: number;
  longitude?: number;
}

export interface Listing {
  id: string;
  storeId: string;
  title: string;
  description: string;
  originalPrice: number;
  currentPrice: number;
  closingTime: string; // ISO timestamp or HH:MM
  quantity: number;
  imageUrl: string;
  status: 'active' | 'sold_out' | 'expired';
  createdAt?: string;
  category?: 'Bakery' | 'Cafe' | 'Snacks' | 'Drinks' | 'Grocery';
  expiryDate?: string; // YYYY-MM-DD or ISO timestamp
  pricingMode?: 'closing_time' | 'expiry_date'; // Hourly closing drop vs Near-expiry daily drop
}

export interface Order {
  id: string;
  listingId: string;
  userId: string;
  quantity: number;
  totalPaid: number;
  createdAt: string; 
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'merchant';
  storeId?: string;
}

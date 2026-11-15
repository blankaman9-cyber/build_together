import { Store, Listing, Order } from '../types';
import { mockStores, mockListings, mockOrders } from '../data/mockData';

const STORAGE_KEYS = {
  STORES: 'freshsave_stores',
  LISTINGS: 'freshsave_listings',
  ORDERS: 'freshsave_orders',
};

// Check if running in browser environment
const isBrowser = typeof window !== 'undefined';

// In-memory fallback for SSR or environments without localStorage
let memoryStores: Store[] = [...mockStores];
let memoryListings: Listing[] = [...mockListings];
let memoryOrders: Order[] = [...mockOrders];

function loadFromStorage<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch (error) {
    console.warn(`[FreshSave] Error reading localStorage key "${key}":`, error);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`[FreshSave] Error saving to localStorage key "${key}":`, error);
  }
}

// Initialise storage with defaults if not present
function initializeData() {
  if (isBrowser) {
    if (!window.localStorage.getItem(STORAGE_KEYS.STORES)) {
      saveToStorage(STORAGE_KEYS.STORES, mockStores);
    }
    if (!window.localStorage.getItem(STORAGE_KEYS.LISTINGS)) {
      saveToStorage(STORAGE_KEYS.LISTINGS, mockListings);
    }
    if (!window.localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      saveToStorage(STORAGE_KEYS.ORDERS, mockOrders);
    }
  }
}

// Ensure initial data is set up
initializeData();

/**
 * Fetch all stores
 */
export async function fetchStores(): Promise<Store[]> {
  if (isBrowser) {
    return loadFromStorage<Store[]>(STORAGE_KEYS.STORES, memoryStores);
  }
  return memoryStores;
}
export const getStores = fetchStores;

/**
 * Fetch a store by its ID
 */
export async function fetchStoreById(id: string): Promise<Store | null> {
  const stores = await fetchStores();
  return stores.find((store) => store.id === id) || null;
}
export const getStoreById = fetchStoreById;

/**
 * Fetch all active listings with quantity > 0
 */
export async function fetchActiveListings(): Promise<Listing[]> {
  const listings = isBrowser
    ? loadFromStorage<Listing[]>(STORAGE_KEYS.LISTINGS, memoryListings)
    : memoryListings;

  return listings.filter((l) => l.status === 'active' && l.quantity > 0);
}
export const getActiveListings = fetchActiveListings;

/**
 * Fetch all listings for a specific store
 */
export async function fetchListingsByStoreId(storeId: string): Promise<Listing[]> {
  const listings = isBrowser
    ? loadFromStorage<Listing[]>(STORAGE_KEYS.LISTINGS, memoryListings)
    : memoryListings;

  return listings.filter((l) => l.storeId === storeId);
}
export const getListingsByStoreId = fetchListingsByStoreId;

/**
 * Add a new surplus listing (Merchant dashboard action)
 */
export async function addListing(
  listingData: Omit<Listing, 'id'> | Omit<Listing, 'id' | 'status'>
): Promise<Listing> {
  const currentListings = isBrowser
    ? loadFromStorage<Listing[]>(STORAGE_KEYS.LISTINGS, memoryListings)
    : memoryListings;

  const newListing: Listing = {
    ...listingData,
    id: `listing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    status: (listingData as Partial<Listing>).status || 'active',
  };

  const updatedListings = [newListing, ...currentListings];

  if (isBrowser) {
    saveToStorage(STORAGE_KEYS.LISTINGS, updatedListings);
  } else {
    memoryListings = updatedListings;
  }

  return newListing;
}

/**
 * Claim (purchase) a listing and decrement its quantity
 * If quantity reaches 0, sets status to 'sold_out'
 */
export async function claimListing(
  listingId: string,
  quantityToClaim: number = 1,
  userId: string = 'user-customer-1'
): Promise<{ success: boolean; listing?: Listing; order?: Order; error?: string }> {
  const listings = isBrowser
    ? loadFromStorage<Listing[]>(STORAGE_KEYS.LISTINGS, memoryListings)
    : memoryListings;

  const listingIndex = listings.findIndex((l) => l.id === listingId);

  if (listingIndex === -1) {
    return { success: false, error: 'Listing not found' };
  }

  const targetListing = listings[listingIndex];

  if (targetListing.quantity < quantityToClaim) {
    return { success: false, error: 'Not enough surplus quantity remaining' };
  }

  const remainingQty = targetListing.quantity - quantityToClaim;
  const updatedListing: Listing = {
    ...targetListing,
    quantity: remainingQty,
    status: remainingQty === 0 ? 'sold_out' : targetListing.status,
  };

  listings[listingIndex] = updatedListing;

  // Create an order record
  const newOrder: Order = {
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    listingId: targetListing.id,
    userId,
    quantity: quantityToClaim,
    totalPaid: Number((targetListing.currentPrice * quantityToClaim).toFixed(2)),
    createdAt: new Date().toISOString(),
  };

  const currentOrders = isBrowser
    ? loadFromStorage<Order[]>(STORAGE_KEYS.ORDERS, memoryOrders)
    : memoryOrders;

  const updatedOrders = [newOrder, ...currentOrders];

  if (isBrowser) {
    saveToStorage(STORAGE_KEYS.LISTINGS, listings);
    saveToStorage(STORAGE_KEYS.ORDERS, updatedOrders);
  } else {
    memoryListings = listings;
    memoryOrders = updatedOrders;
  }

  return {
    success: true,
    listing: updatedListing,
    order: newOrder,
  };
}

/**
 * Fetch all orders
 */
export async function fetchOrders(): Promise<Order[]> {
  if (isBrowser) {
    return loadFromStorage<Order[]>(STORAGE_KEYS.ORDERS, memoryOrders);
  }
  return memoryOrders;
}
export const getOrders = fetchOrders;

/**
 * Helper: Reset data back to original mock fixtures (useful for demo resets)
 */
export function resetMockData(): void {
  if (isBrowser) {
    saveToStorage(STORAGE_KEYS.STORES, mockStores);
    saveToStorage(STORAGE_KEYS.LISTINGS, mockListings);
    saveToStorage(STORAGE_KEYS.ORDERS, mockOrders);
  }
  memoryStores = [...mockStores];
  memoryListings = [...mockListings];
  memoryOrders = [...mockOrders];
}

/**
 * Dynamic price helper: Calculates the discounted price based on minutes remaining until closing time
 * E.g., drops progressively from 30% to up to 70% off as closing approaches
 */
export function calculateDynamicPrice(
  originalPrice: number,
  closingTimeStr: string,
  now: Date = new Date()
): { currentPrice: number; discountPercent: number; minutesRemaining: number } {
  // Parse closing time (expected "HH:mm" or ISO format)
  let closingDate: Date;
  if (closingTimeStr.includes('T')) {
    closingDate = new Date(closingTimeStr);
  } else {
    const [hours, minutes] = closingTimeStr.split(':').map(Number);
    closingDate = new Date(now);
    closingDate.setHours(hours, minutes, 0, 0);
  }

  const diffMs = closingDate.getTime() - now.getTime();
  const minutesRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  // Dynamic discount schedule:
  // > 120 mins remaining: 30% discount
  // 60 - 120 mins remaining: 45% discount
  // 30 - 60 mins remaining: 60% discount
  // < 30 mins remaining: 70% discount
  let discountPercent = 30;
  if (minutesRemaining <= 30) {
    discountPercent = 70;
  } else if (minutesRemaining <= 60) {
    discountPercent = 60;
  } else if (minutesRemaining <= 120) {
    discountPercent = 45;
  }

  const currentPrice = Number((originalPrice * (1 - discountPercent / 100)).toFixed(2));

  return {
    currentPrice,
    discountPercent,
    minutesRemaining,
  };
}

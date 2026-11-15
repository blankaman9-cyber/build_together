import { Store, Listing, Order } from '../types';
import { mockStores, mockListings, mockOrders } from '../data/mockData';

export const STORAGE_KEYS = {
  STORES: 'freshsave_stores',
  LISTINGS: 'freshsave_listings',
  ORDERS: 'freshsave_orders',
} as const;

export const EVENT_LISTINGS_UPDATED = 'freshsave:listings_updated';

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
    console.warn(`[FreshSave Storage] Error reading localStorage key "${key}":`, error);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`[FreshSave Storage] Error saving to localStorage key "${key}":`, error);
  }
}

/**
 * Dispatch events across current tab and notify listeners
 */
function notifyListingsChange(updatedListings: Listing[]): void {
  if (!isBrowser) return;
  try {
    // Custom event for same-tab reactive updates
    window.dispatchEvent(
      new CustomEvent(EVENT_LISTINGS_UPDATED, { detail: updatedListings })
    );
    // Synthetic storage event to notify other storage listeners if needed
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_KEYS.LISTINGS,
        newValue: JSON.stringify(updatedListings),
      })
    );
  } catch (error) {
    console.warn('[FreshSave Storage] Error notifying listing changes:', error);
  }
}

// Initialise storage with defaults if not present
function initializeData(): void {
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
 * Fetch all listings (regardless of status)
 */
export async function fetchAllListings(): Promise<Listing[]> {
  if (isBrowser) {
    return loadFromStorage<Listing[]>(STORAGE_KEYS.LISTINGS, memoryListings);
  }
  return memoryListings;
}
export const getAllListings = fetchAllListings;

/**
 * Fetch all active listings with quantity > 0
 */
export async function fetchActiveListings(): Promise<Listing[]> {
  const listings = await fetchAllListings();
  return listings.filter((l) => l.status === 'active' && l.quantity > 0);
}
export const getActiveListings = fetchActiveListings;

/**
 * Fetch all listings for a specific store (for merchant dashboard)
 */
export async function fetchListingsByStoreId(storeId: string): Promise<Listing[]> {
  const listings = await fetchAllListings();
  return listings.filter((l) => l.storeId === storeId);
}
export const getListingsByStoreId = fetchListingsByStoreId;

/**
 * Add a new surplus listing (Merchant dashboard action)
 */
export async function addListing(
  listingData: Omit<Listing, 'id'> | Omit<Listing, 'id' | 'status'>
): Promise<Listing> {
  const currentListings = await fetchAllListings();

  const newListing: Listing = {
    ...listingData,
    id: `listing-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    status: (listingData as Partial<Listing>).status || 'active',
  };

  const updatedListings = [newListing, ...currentListings];

  if (isBrowser) {
    saveToStorage(STORAGE_KEYS.LISTINGS, updatedListings);
    notifyListingsChange(updatedListings);
  } else {
    memoryListings = updatedListings;
  }

  return newListing;
}

/**
 * Update an existing listing (Merchant dashboard action)
 */
export async function updateListing(
  listingId: string,
  updates: Partial<Omit<Listing, 'id'>>
): Promise<Listing | null> {
  const currentListings = await fetchAllListings();
  const listingIndex = currentListings.findIndex((l) => l.id === listingId);

  if (listingIndex === -1) {
    console.warn(`[FreshSave Storage] Listing with ID "${listingId}" not found for update.`);
    return null;
  }

  const existingListing = currentListings[listingIndex];
  const updatedListing: Listing = {
    ...existingListing,
    ...updates,
    id: existingListing.id, // ID remains immutable
  };

  // If quantity was updated to 0 and status was not explicitly passed, mark sold_out
  if (updatedListing.quantity <= 0 && !updates.status) {
    updatedListing.status = 'sold_out';
  } else if (updatedListing.quantity > 0 && existingListing.status === 'sold_out' && !updates.status) {
    updatedListing.status = 'active';
  }

  const updatedListings = [...currentListings];
  updatedListings[listingIndex] = updatedListing;

  if (isBrowser) {
    saveToStorage(STORAGE_KEYS.LISTINGS, updatedListings);
    notifyListingsChange(updatedListings);
  } else {
    memoryListings = updatedListings;
  }

  return updatedListing;
}

/**
 * Delete a listing by ID (Merchant dashboard action)
 */
export async function deleteListing(listingId: string): Promise<boolean> {
  const currentListings = await fetchAllListings();
  const filteredListings = currentListings.filter((l) => l.id !== listingId);

  if (filteredListings.length === currentListings.length) {
    console.warn(`[FreshSave Storage] Listing with ID "${listingId}" not found for deletion.`);
    return false;
  }

  if (isBrowser) {
    saveToStorage(STORAGE_KEYS.LISTINGS, filteredListings);
    notifyListingsChange(filteredListings);
  } else {
    memoryListings = filteredListings;
  }

  return true;
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
  const currentListings = await fetchAllListings();
  const listingIndex = currentListings.findIndex((l) => l.id === listingId);

  if (listingIndex === -1) {
    return { success: false, error: 'Listing not found' };
  }

  const targetListing = currentListings[listingIndex];

  if (targetListing.quantity < quantityToClaim) {
    return { success: false, error: 'Not enough surplus quantity remaining' };
  }

  const remainingQty = targetListing.quantity - quantityToClaim;
  const updatedListing: Listing = {
    ...targetListing,
    quantity: remainingQty,
    status: remainingQty === 0 ? 'sold_out' : targetListing.status,
  };

  const updatedListings = [...currentListings];
  updatedListings[listingIndex] = updatedListing;

  // Create an order record
  const newOrder: Order = {
    id: `order-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
    saveToStorage(STORAGE_KEYS.LISTINGS, updatedListings);
    saveToStorage(STORAGE_KEYS.ORDERS, updatedOrders);
    notifyListingsChange(updatedListings);
  } else {
    memoryListings = updatedListings;
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
 * Reset data back to original mock fixtures (useful for live demo resets)
 */
export function resetMockData(): void {
  if (isBrowser) {
    saveToStorage(STORAGE_KEYS.STORES, mockStores);
    saveToStorage(STORAGE_KEYS.LISTINGS, mockListings);
    saveToStorage(STORAGE_KEYS.ORDERS, mockOrders);
    notifyListingsChange(mockListings);
  }
  memoryStores = [...mockStores];
  memoryListings = [...mockListings];
  memoryOrders = [...mockOrders];
}

/**
 * Subscribe to real-time listing updates across both the current tab and other tabs
 * Perfect for keeping customer feed and merchant inventory in sync inside a useEffect hook:
 *
 * useEffect(() => {
 *   const unsubscribe = subscribeToListings((updatedListings) => {
 *     setListings(updatedListings.filter(l => l.status === 'active' && l.quantity > 0));
 *   });
 *   return unsubscribe;
 * }, []);
 */
export function subscribeToListings(callback: (listings: Listing[]) => void): () => void {
  if (!isBrowser) return () => {};

  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<Listing[]>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      fetchAllListings().then(callback);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.LISTINGS && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as Listing[];
        callback(parsed);
      } catch (err) {
        fetchAllListings().then(callback);
      }
    }
  };

  window.addEventListener(EVENT_LISTINGS_UPDATED, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(EVENT_LISTINGS_UPDATED, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

/**
 * Dynamic price helper: Calculates the discounted price based on minutes remaining until closing time
 */
export function calculateDynamicPrice(
  originalPrice: number,
  closingTimeStr: string,
  now: Date = new Date()
): { currentPrice: number; discountPercent: number; minutesRemaining: number } {
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

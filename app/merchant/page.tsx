
"use client";

import { useCallback, useEffect, useState } from "react";

import type { Listing, Store } from "../../types";

import {
  fetchStoreById,
  fetchListingsByStoreId,
  addListing,
  updateListing,
  deleteListing,
  subscribeToListings,
} from "../../lib/storage";

import AddListingForm, {
  type NewListingInput,
} from "../../components/merchant/AddListingForm";

import InventoryManager from "../../components/merchant/InventoryManager";

// Demo merchant: The Golden Loaf Bakery
const MERCHANT_STORE_ID = "store-1";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MerchantPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStoreData = useCallback(async () => {
    try {
      const [storeData, listingData] = await Promise.all([
        fetchStoreById(MERCHANT_STORE_ID),
        fetchListingsByStoreId(MERCHANT_STORE_ID),
      ]);

      setStore(storeData);
      setListings(listingData);

      if (!storeData) {
        setError("Merchant store could not be found.");
      }
    } catch {
      setError("Unable to load your merchant dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeToListings((updatedListings) => {
      if (mounted) {
        setListings(
          updatedListings.filter(
            (listing) => listing.storeId === MERCHANT_STORE_ID
          )
        );
      }
    });

    loadStoreData();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadStoreData]);

  const handleAddListing = async (input: NewListingInput) => {
    if (!store) return;

    await addListing({
      storeId: store.id,
      title: input.title,
      description: `Fresh end-of-day surplus from ${store.name}.`,
      originalPrice: input.originalPrice,
      currentPrice: input.currentPrice,
      closingTime: input.closingTime,
      quantity: input.quantity,
      imageUrl: store.imageUrl,
      status: "active",
    });

    // Storage subscription updates the inventory automatically.
  };

  const handleMarkSoldOut = async (listingId: string) => {
    const updated = await updateListing(listingId, {
      status: "sold_out",
      quantity: 0,
    });

    if (!updated) {
      throw new Error("Listing could not be updated.");
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    const deleted = await deleteListing(listingId);

    if (!deleted) {
      throw new Error("Listing could not be deleted.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100">
        <p className="text-lg font-bold text-stone-600">
          Loading your bakery dashboard...
        </p>
      </main>
    );
  }

  if (!store || error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-black text-stone-900">
            Dashboard unavailable
          </h1>
          <p className="mt-2 text-stone-600">
            {error || "Store information could not be loaded."}
          </p>
          <button
            onClick={() => {
              setError("");
              setLoading(true);
              void loadStoreData();
            }}
            className="mt-5 min-h-12 rounded-xl bg-emerald-700 px-6 font-bold text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const activeListings = listings.filter(
    (listing) => listing.status === "active" && listing.quantity > 0
  );

  const totalQuantity = activeListings.reduce(
    (total, listing) => total + listing.quantity,
    0
  );

  const potentialSavings = activeListings.reduce(
    (total, listing) =>
      total +
      (listing.originalPrice - listing.currentPrice) * listing.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-stone-100 text-stone-950">
      {/* Dashboard header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl" aria-hidden="true">🥐</span>
              <h1 className="text-2xl font-black tracking-tight">
                FreshSave
              </h1>
              <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-800">
                MERCHANT
              </span>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              Surplus management dashboard
            </p>
          </div>

          <div className="rounded-xl bg-stone-100 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Currently managing
            </p>
            <p className="mt-1 font-black text-stone-900">
              {store.name}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-7 px-5 py-7 sm:px-8 sm:py-9">
        {/* Store information */}
        <section>
          <p className="text-sm font-bold text-emerald-700">
            GOOD DAY, MERCHANT!
          </p>

          <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
            Let's save today's surplus.
          </h2>

          <p className="mt-2 text-stone-600">
            Manage your end-of-day food listings and help reduce food waste.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-stone-600">
            <span>📍 {store.address}</span>
            <span>🕒 Store closes at {store.closingTime}</span>
          </div>
        </section>

        {/* Dashboard statistics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Active listings"
            value={activeListings.length.toString()}
            description="Items currently available"
            icon="📦"
          />

          <StatCard
            label="Surplus quantity"
            value={totalQuantity.toString()}
            description="Units available for pickup"
            icon="🥖"
          />

          <StatCard
            label="Customer savings"
            value={formatPrice(potentialSavings)}
            description="Potential savings across active stock"
            icon="💚"
          />
        </section>

        {/* Main merchant workspace */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <AddListingForm
            store={store}
            onAdd={handleAddListing}
          />

          <InventoryManager
            store={store}
            listings={listings}
            onMarkSoldOut={handleMarkSoldOut}
            onDelete={handleDeleteListing}
          />
        </div>

        <footer className="border-t border-stone-200 py-5 text-center text-xs font-medium text-stone-500">
          FreshSave · Give good food a second chance.
        </footer>
      </div>
    </main>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  description: string;
  icon: string;
}

function StatCard({
  label,
  value,
  description,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-stone-500">{label}</p>
        <span className="text-2xl" aria-hidden="true">{icon}</span>
      </div>

      <p className="mt-3 text-3xl font-black tracking-tight text-stone-950">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-stone-500">
        {description}
      </p>
    </div>
  );
}

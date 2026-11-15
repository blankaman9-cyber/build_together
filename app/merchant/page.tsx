"use client";

import { useCallback, useEffect, useState } from "react";
import type { Listing, Store } from "@/types";
import {
  fetchStoreById,
  fetchListingsByStoreId,
  addListing,
  updateListing,
  deleteListing,
  subscribeToListings,
} from "@/lib/storage";
import AddListingForm, {
  type NewListingInput,
} from "@/components/merchant/AddListingForm";
import InventoryManager from "@/components/merchant/InventoryManager";

// Demo merchant: The Golden Loaf Bakery & Market
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
      description: `Surplus stock & near-expiry markdown from ${store.name}.`,
      originalPrice: input.originalPrice,
      currentPrice: input.currentPrice,
      closingTime: input.closingTime,
      quantity: input.quantity,
      imageUrl: store.imageUrl,
      status: "active",
      createdAt: new Date().toISOString(),
      category: input.category,
      pricingMode: input.pricingMode,
      expiryDate: input.expiryDate,
    });
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
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-base font-bold text-stone-600 animate-pulse">
          Loading merchant dashboard...
        </p>
      </main>
    );
  }

  if (!store || error) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg max-w-md w-full border border-stone-200">
          <h1 className="text-xl font-black text-stone-900">
            Dashboard Unavailable
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            {error || "Store information could not be loaded."}
          </p>
          <button
            onClick={() => {
              setError("");
              setLoading(true);
              void loadStoreData();
            }}
            className="mt-5 rounded-xl bg-emerald-700 px-6 py-2.5 font-bold text-white transition hover:bg-emerald-800"
          >
            Try Again
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
    <div className="space-y-6">
      {/* Merchant Header / Store Status */}
      <section className="rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-500/30 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-200 border border-emerald-400/30">
                MERCHANT COUNTER
              </span>
              <span className="text-xs text-emerald-200">
                Fresh Bakes · Snacks · Cold Drinks
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">
              {store.name}
            </h1>
            <p className="mt-1 text-sm text-emerald-100 flex flex-wrap gap-x-4">
              <span>📍 {store.address}</span>
              <span>🕒 Store Closes at {store.closingTime}</span>
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/15 text-right sm:min-w-[180px]">
            <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
              Live Stock
            </p>
            <p className="mt-0.5 text-2xl font-black text-white">
              {totalQuantity} Units
            </p>
            <p className="text-[11px] text-emerald-300">Visible on Consumer Radar</p>
          </div>
        </div>
      </section>

      {/* Dashboard KPI statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Surplus Items"
          value={activeListings.length.toString()}
          description="Live on consumer feed & radar map"
          icon="📦"
        />

        <StatCard
          label="Total Units Available"
          value={totalQuantity.toString()}
          description="Bakes, snacks & drinks saved"
          icon="🥖"
        />

        <StatCard
          label="Discount Given"
          value={formatPrice(potentialSavings)}
          description="Customer savings across active stock"
          icon="💚"
        />
      </section>

      {/* Main merchant workspace: Add Listing + Live Inventory */}
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
    </div>
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
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{label}</p>
        <span className="text-2xl" aria-hidden="true">{icon}</span>
      </div>

      <p className="mt-2 text-2xl font-black tracking-tight text-stone-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-stone-500 font-medium">
        {description}
      </p>
    </div>
  );
}

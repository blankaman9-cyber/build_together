use client";

import { useEffect, useMemo, useState } from "react";
import type { Listing, Store } from "../../types";
import {
  fetchActiveListings,
  fetchStores,
  subscribeToListings,
} from "../../lib/storage";
import ListingCard from "./ListingCard";

export type CategoryFilter = "All" | "Bakery" | "Cafes" | "< 2km";

interface StoreFeedProps {
  searchQuery: string;
  category: CategoryFilter;
}

export default function StoreFeed({
  searchQuery,
  category,
}: StoreFeedProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadMarketplace = async () => {
      setLoading(true);
      setError("");

      try {
        const [storeData, listingData] = await Promise.all([
          fetchStores(),
          fetchActiveListings(),
        ]);

        if (!mounted) {
          return;
        }

        setStores(storeData);
        setListings(
          listingData.filter(
            (listing) =>
              listing.status === "active" && listing.quantity > 0,
          ),
        );
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load the marketplace.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMarketplace();

    const unsubscribe = subscribeToListings?.((updatedListings: Listing[]) => {
      if (!mounted) {
        return;
      }

      setListings(
        updatedListings.filter(
          (listing) =>
            listing.status === "active" && listing.quantity > 0,
        ),
      );
    });

    return () => {
      mounted = false;

      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const filteredListings = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const storeById = new Map(stores.map((store) => [store.id, store]));

    return listings.filter((listing) => {
      const store = storeById.get(listing.storeId);

      if (!store) {
        return false;
      }

      const matchesSearch =
        !normalizedSearch ||
        listing.title.toLowerCase().includes(normalizedSearch) ||
        listing.description.toLowerCase().includes(normalizedSearch) ||
        store.name.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      switch (category) {
        case "Bakery":
          return store.category.toLowerCase() === "bakery";
        case "Cafes":
          return store.category.toLowerCase() === "cafe";
        case "< 2km":
          return (
            typeof store.distanceKm === "number" && store.distanceKm < 2
          );
        default:
          return true;
      }
    });
  }, [category, listings, searchQuery, stores]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"
          >
            <div className="aspect-[16/10] animate-pulse bg-slate-200" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-center">
        <p className="font-semibold text-red-800">
          Unable to load FreshSave listings.
        </p>
        <p className="mt-1 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (filteredListings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-lg font-bold text-slate-900">
          No matching surplus food
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Try another search or category. New listings can appear throughout
          the day.
        </p>
      </div>
    );
  }

  const storeById = new Map(stores.map((store) => [store.id, store]));

  return (
    <section aria-label="Available FreshSave listings">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Available nearby
          </h2>
          <p className="text-sm text-slate-500">
            {filteredListings.length} listing
            {filteredListings.length === 1 ? "" : "s"} available
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredListings.map((listing) => {
          const store = storeById.get(listing.storeId);

          if (!store) {
            return null;
          }

          return (
            <ListingCard
              key={listing.id}
              listing={listing}
              store={store}
              onClaimed={(listingId) => {
                setListings((current) =>
                  current.map((item) =>
                    item.id === listingId
                      ? {
                          ...item,
                          quantity: Math.max(0, item.quantity - 1),
                          status:
                            item.quantity - 1 <= 0
                              ? "sold_out"
                              : item.status,
                        }
                      : item,
                  ),
                );
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

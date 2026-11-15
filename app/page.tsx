"use client";

import { useEffect, useState } from "react";
import StoreFeed, {
  CategoryFilter,
} from "@/components/customer/StoreFeed";
import StoresMapView from "@/components/customer/StoresMapView";
import { fetchStores, fetchActiveListings, subscribeToListings } from "@/lib/storage";
import type { Store, Listing } from "@/types";

const categories: CategoryFilter[] = [
  "All",
  "Bakery",
  "Cafes",
  "Snacks",
  "Drinks",
  "< 2km",
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [viewMode, setViewMode] = useState<"feed" | "map">("feed");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const [stores, setStores] = useState<Store[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    fetchStores().then(setStores);
    fetchActiveListings().then(setListings);

    const unsubscribe = subscribeToListings?.((updatedListings) => {
      setListings(updatedListings.filter((l) => l.status === "active" && l.quantity > 0));
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner / Value Prop Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 px-6 py-8 sm:px-10 sm:py-10 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-wider text-white border border-white/20">
              ⏳ Dynamic Price Drops Before Closing & Expiry
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/30 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-amber-200 border border-amber-300/30">
              ⚡ Up to 70% Off
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl leading-tight">
            Save Fresh Surplus, Snacks & Cold Drinks.
          </h1>
          <p className="mt-3 text-base text-emerald-50 leading-relaxed max-w-xl">
            Local bakeries, cafes & convenience marts drop prices hourly as closing and expiry dates approach. Find delicious food and cold beverages near your coordinates!
          </p>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-10 bottom-2 text-8xl opacity-20 pointer-events-none select-none">
          🥐
        </div>
      </section>

      {/* View Switcher: Feed View vs Map View */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <input
            id="marketplace-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search sourdough, cold brew, snacks, juices, chips..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 pr-12 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
          >
            🔍
          </span>
        </div>

        {/* Map / Grid Mode Toggle */}
        <div className="inline-flex items-center rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("feed")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              viewMode === "feed"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📋</span>
            <span>Listings Feed</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              viewMode === "map"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🗺️</span>
            <span>Nearby Shops Map</span>
          </button>
        </div>
      </div>

      {/* Category Pills (Visible in Feed Mode) */}
      {viewMode === "feed" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((item) => {
            const active = category === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition active:scale-95 ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
                aria-pressed={active}
              >
                {item === "Bakery" && "🥖 "}
                {item === "Cafes" && "☕ "}
                {item === "Snacks" && "🥨 "}
                {item === "Drinks" && "🥤 "}
                {item === "< 2km" && "📍 "}
                {item}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === "feed" ? (
        <StoreFeed
          searchQuery={searchQuery}
          category={category}
          selectedStoreId={selectedStoreId}
        />
      ) : (
        <StoresMapView
          stores={stores}
          listings={listings}
          selectedStoreId={selectedStoreId}
          onSelectStore={(id) => setSelectedStoreId(id)}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { Listing, Store } from "../../types";
import PriceHistoryModal from "../PriceHistoryModal";
import { calculateCurrentPrice } from "@/utils/pricing";

interface InventoryManagerProps {
  listings: Listing[];
  store: Store;
  onMarkSoldOut: (listingId: string) => Promise<void>;
  onDelete: (listingId: string) => Promise<void>;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function InventoryManager({
  listings,
  store,
  onMarkSoldOut,
  onDelete,
}: InventoryManagerProps) {
  const [selectedGraphListing, setSelectedGraphListing] = useState<Listing | null>(null);

  const activeListings = listings.filter(
    (item) => item.storeId === store.id && item.status === "active" && item.quantity > 0
  );

  const soldOutListings = listings.filter(
    (item) => item.storeId === store.id && (item.status === "sold_out" || item.quantity === 0)
  );

  return (
    <>
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
              Store Counter
            </p>
            <h2 className="mt-1 text-2xl font-black text-stone-950">
              Live Shelf Inventory
            </h2>
          </div>

          <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-black text-emerald-900 border border-emerald-200">
            {activeListings.length} LIVE ON APP
          </span>
        </div>

        {activeListings.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-stone-200 px-5 py-12 text-center">
            <div className="text-5xl" aria-hidden="true">
              🥐
            </div>
            <h3 className="mt-4 text-lg font-black text-stone-900">
              Nothing on the shelf right now!
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              Use the form to list surplus bakery items before closing time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeListings.map((item) => (
              <InventoryItem
                key={item.id}
                item={item}
                onMarkSoldOut={onMarkSoldOut}
                onDelete={onDelete}
                onOpenGraph={() => setSelectedGraphListing(item)}
              />
            ))}
          </div>
        )}

        {soldOutListings.length > 0 && (
          <div className="border-t border-stone-100 pt-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-400 mb-3">
              Sold Out / Claimed ({soldOutListings.length})
            </h3>
            <div className="space-y-2 opacity-60">
              {soldOutListings.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs"
                >
                  <span className="font-semibold text-stone-700">{item.title}</span>
                  <span className="font-bold text-red-600 uppercase">Sold Out</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Price History Modal for Merchant Inspection */}
      {selectedGraphListing && (
        <PriceHistoryModal
          listing={selectedGraphListing}
          isOpen={Boolean(selectedGraphListing)}
          onClose={() => setSelectedGraphListing(null)}
        />
      )}
    </>
  );
}

interface InventoryItemProps {
  item: Listing;
  onMarkSoldOut: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenGraph: () => void;
}

function InventoryItem({
  item,
  onMarkSoldOut,
  onDelete,
  onOpenGraph,
}: InventoryItemProps) {
  const dynamicPrice = calculateCurrentPrice(
    item.originalPrice,
    item.createdAt || new Date(Date.now() - 3600000).toISOString(),
    item.closingTime
  );

  return (
    <div className="rounded-xl border border-stone-200 p-4 transition hover:border-emerald-300 bg-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-stone-950">
              {item.title}
            </h3>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
              ACTIVE
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-black text-emerald-700">
              {formatPrice(dynamicPrice)} (Live Dynamic)
            </span>
            <span className="text-stone-400 line-through text-xs">
              {formatPrice(item.originalPrice)}
            </span>
            <span className="text-stone-300">·</span>
            <span className="font-bold text-stone-700">
              {item.quantity} portions left
            </span>
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-stone-500">
            <span>Pickup closes at {item.closingTime}</span>
            <button
              type="button"
              onClick={onOpenGraph}
              className="font-bold text-emerald-700 hover:text-emerald-800 underline decoration-emerald-300"
            >
              📈 View Price Drop Curve
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => void onMarkSoldOut(item.id)}
            aria-label={`Mark ${item.title} as sold out`}
            className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900 transition hover:bg-amber-100 active:scale-[0.98]"
          >
            Mark Sold Out
          </button>

          <button
            type="button"
            onClick={() => void onDelete(item.id)}
            aria-label={`Delete ${item.title}`}
            className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-black text-stone-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 active:scale-[0.98]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

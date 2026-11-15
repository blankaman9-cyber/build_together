
"use client";

import type { Listing, Store } from "../../types";

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
    maximumFractionDigits: 2,
  }).format(price);
}

export default function InventoryManager({
  listings,
  store,
  onMarkSoldOut,
  onDelete,
}: InventoryManagerProps) {
  const activeListings = listings.filter(
    (item) => item.storeId === store.id && item.status === "active"
  );

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
            Your counter
          </p>
          <h2 className="mt-1 text-2xl font-black text-stone-950">
            Live inventory
          </h2>
        </div>

        <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-900">
          {activeListings.length} LIVE
        </span>
      </div>

      {activeListings.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-stone-200 px-5 py-12 text-center">
          <div className="text-5xl" aria-hidden="true">
            🥐
          </div>
          <h3 className="mt-4 text-lg font-black text-stone-900">
            Nothing on the shelf yet!
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Your active surplus listings will appear here.
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
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface InventoryItemProps {
  item: Listing;
  onMarkSoldOut: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function InventoryItem({
  item,
  onMarkSoldOut,
  onDelete,
}: InventoryItemProps) {
  return (
    <div className="rounded-xl border border-stone-200 p-4 transition hover:border-emerald-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-stone-950">
              {item.title}
            </h3>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              ACTIVE
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-black text-stone-900">
              {formatPrice(item.currentPrice)}
            </span>
            <span className="text-stone-400 line-through">
              {formatPrice(item.originalPrice)}
            </span>
            <span className="text-stone-400">·</span>
            <span className="font-semibold text-stone-600">
              {item.quantity} available
            </span>
          </div>

          <p className="mt-2 text-xs font-semibold text-stone-500">
            Pickup closes at {item.closingTime}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => void onMarkSoldOut(item.id)}
            aria-label={`Mark ${item.title} as sold out`}
            className="min-h-12 rounded-xl border-2 border-emerald-700 px-4 py-2 text-sm font-black text-emerald-800 transition hover:bg-emerald-50 active:scale-[0.98]"
          >
            Sold out
          </button>

          <button
            type="button"
            onClick={() => void onDelete(item.id)}
            aria-label={`Delete ${item.title}`}
            className="min-h-12 rounded-xl border-2 border-stone-200 px-4 py-2 text-sm font-black text-stone-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 active:scale-[0.98]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}


use client";

import { useState } from "react";
import type { Listing, Store } from "../../types";
import ClaimModal from "./ClaimModal";

type ListingWithCreatedAt = Listing & {
  createdAt?: string;
};

interface ListingCardProps {
  listing: Listing;
  store: Store;
  onClaimed?: (listingId: string) => void;
}

export default function ListingCard({
  listing,
  store,
  onClaimed,
}: ListingCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const item = listing as ListingWithCreatedAt;

  const distance =
    typeof store.distanceKm === "number"
      ? `${store.distanceKm.toFixed(1)} km`
      : "Nearby";

  const isUnavailable = listing.status !== "active" || listing.quantity <= 0;

  return (
    <>
      <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          {listing.imageUrl ? (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
              FreshSave
            </div>
          )}

          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            {distance}
          </span>

          <span className="absolute right-3 top-3 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white">
            {listing.quantity} left
          </span>
        </div>

        <div className="p-4">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                {store.name}
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {listing.title}
              </h2>
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-600">
            {listing.description}
          </p>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">Was</p>
              <p className="text-sm font-medium text-slate-400 line-through">
                ₹{listing.originalPrice.toFixed(2)}
              </p>
              <p className="text-xl font-extrabold text-emerald-600">
                ₹{listing.currentPrice.toFixed(2)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={isUnavailable}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isUnavailable ? "Unavailable" : "Claim"}
            </button>
          </div>

          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {item.createdAt ? (
              <span>
                Dynamic pricing active · pickup by {listing.closingTime}
              </span>
            ) : (
              <span>Pickup by {listing.closingTime}</span>
            )}
          </div>
        </div>
      </article>

      <ClaimModal
        listing={listing}
        store={store}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClaimed={() => {
          onClaimed?.(listing.id);
        }}
      />
    </>
  );
}

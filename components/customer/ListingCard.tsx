"use client";

import { useState } from "react";
import type { Listing, Store } from "../../types";
import ClaimModal from "./ClaimModal";
import CountdownBadge from "../CountdownBadge";
import PriceHistoryModal from "../PriceHistoryModal";
import { calculateCurrentPrice } from "@/utils/pricing";

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Dynamic live price calculation
  const computedPrice = calculateCurrentPrice(
    listing.originalPrice,
    listing.createdAt || new Date(Date.now() - 3600000).toISOString(),
    listing.closingTime,
    Date.now(),
    listing.expiryDate
  );

  const [livePrice, setLivePrice] = useState(computedPrice || listing.currentPrice);

  const distance =
    typeof store.distanceKm === "number"
      ? `${store.distanceKm.toFixed(1)} km`
      : "Nearby";

  const isUnavailable = listing.status !== "active" || listing.quantity <= 0;

  // Format expiry badge text if present
  const expiryBadge = listing.expiryDate ? (() => {
    const exp = new Date(listing.expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 0) return "Expiring Today!";
    if (diffDays === 1) return "Expiring Tomorrow";
    return `Expiring in ${diffDays}d`;
  })() : null;

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-1 hover:shadow-lg">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          {listing.imageUrl ? (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
              FreshSave
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

          {/* Location & Category Badges */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <span className="rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
              📍 {distance}
            </span>
            {listing.category && (
              <span className="rounded-full bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                {listing.category === "Bakery" && "🥖 "}
                {listing.category === "Snacks" && "🥨 "}
                {listing.category === "Drinks" && "🥤 "}
                {listing.category}
              </span>
            )}
          </div>

          {/* Quantity or Expiry Pill */}
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${
                listing.quantity <= 2
                  ? "bg-rose-600 text-white animate-pulse"
                  : "bg-slate-900/85 text-white"
              }`}
            >
              {listing.quantity} left
            </span>

            {expiryBadge && (
              <span className="rounded-full bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 shadow-sm">
                ⏱️ {expiryBadge}
              </span>
            )}
          </div>

          {/* Dynamic timer badge over image footer */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-start">
            {listing.expiryDate ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-xs font-bold text-amber-950 shadow-md border border-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Near-Expiry Drop:</span>
                <span className="text-emerald-700 font-black">₹{livePrice}</span>
              </div>
            ) : (
              <CountdownBadge
                originalPrice={listing.originalPrice}
                createdAt={listing.createdAt || new Date(Date.now() - 3600000).toISOString()}
                closingTime={listing.closingTime}
                onPriceUpdate={(p) => setLivePrice(p)}
                className="bg-white/95 backdrop-blur-md shadow-md border-emerald-200"
              />
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {store.name}
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-900 leading-snug">
              {listing.title}
            </h2>
          </div>

          <p className="mt-1.5 flex-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {listing.description}
          </p>

          {/* Dynamic Price Display */}
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
            <div>
              <p className="text-xs font-medium text-slate-400">Original / Dynamic Deal</p>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-slate-400 line-through">
                  ₹{listing.originalPrice.toFixed(0)}
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  ₹{livePrice.toFixed(0)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={isUnavailable}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {isUnavailable ? "Sold Out" : "Claim"}
            </button>
          </div>

          {/* Price History & Details Footer */}
          <div className="mt-2.5 flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
            >
              <span>📈</span>
              <span className="underline decoration-emerald-300 underline-offset-2">
                Price History Graph
              </span>
            </button>

            <span className="text-[11px] font-medium text-slate-400">
              {listing.expiryDate ? `Exp: ${listing.expiryDate}` : `Closes ${listing.closingTime}`}
            </span>
          </div>
        </div>
      </article>

      {/* Claim Modal */}
      <ClaimModal
        listing={{ ...listing, currentPrice: livePrice }}
        store={store}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClaimed={() => {
          onClaimed?.(listing.id);
        }}
      />

      {/* Price History & Markdown Curve Modal */}
      <PriceHistoryModal
        listing={{ ...listing, currentPrice: livePrice }}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </>
  );
}

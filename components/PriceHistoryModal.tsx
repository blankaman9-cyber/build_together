"use client";

import { useEffect } from "react";
import PriceHistoryGraph from "./PriceHistoryGraph";
import type { Listing } from "@/types";

interface PriceHistoryModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
}

export default function PriceHistoryModal({
  listing,
  isOpen,
  onClose,
}: PriceHistoryModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl border border-slate-200"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              {listing.expiryDate ? "Near-Expiry Markdown Schedule" : "Surplus Closing Markdown Curve"}
            </p>
            <h2 className="mt-0.5 text-lg font-black text-slate-900">
              {listing.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <PriceHistoryGraph
            originalPrice={listing.originalPrice}
            createdAt={listing.createdAt}
            closingTime={listing.closingTime}
            expiryDate={listing.expiryDate}
          />

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <span className="text-base select-none">⏳</span>
            <div>
              <p className="font-bold">
                {listing.expiryDate
                  ? "Automated Near-Expiry Price Drop Active"
                  : "Hourly Closing Price Drop Active"}
              </p>
              <p className="mt-0.5 text-amber-800">
                {listing.expiryDate
                  ? `This stock automatically discounts up to 70% off as it approaches expiry (${listing.expiryDate}) to eliminate waste.`
                  : "Prices drop automatically every hour until closing. Waiting gets a cheaper meal, but surplus batches often sell out early!"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </div>
  );
}

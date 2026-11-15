use client";

import { useEffect, useState } from "react";
import type { Listing, Store } from "../../types";
import { claimListing } from "../../lib/storage";

interface ClaimModalProps {
  listing: Listing;
  store: Store;
  isOpen: boolean;
  onClose: () => void;
  onClaimed?: () => void;
}

export default function ClaimModal({
  listing,
  store,
  isOpen,
  onClose,
  onClaimed,
}: ClaimModalProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setMessage("");
      setError("");
      setIsClaiming(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    if (isClaiming || listing.quantity <= 0) {
      return;
    }

    setIsClaiming(true);
    setError("");
    setMessage("");

    try {
      const result = await claimListing(listing.id, 1);

      if (!result) {
        throw new Error("Unable to reserve this item.");
      }

      setMessage("Reservation confirmed! Please collect before closing.");
      onClaimed?.();

      window.setTimeout(() => {
        onClose();
      }, 900);
    } catch (claimError) {
      setError(
        claimError instanceof Error
          ? claimError.message
          : "Unable to reserve this item. Please try again.",
      );
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-modal-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Reserve surplus food
            </p>
            <h2
              id="claim-modal-title"
              className="mt-1 text-xl font-bold text-slate-900"
            >
              {listing.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close reservation dialog"
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {listing.imageUrl && (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="mb-5 aspect-[16/9] w-full rounded-2xl object-cover"
            />
          )}

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {store.name}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {listing.description}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-400 line-through">
                  ₹{listing.originalPrice.toFixed(2)}
                </p>
                <p className="text-2xl font-extrabold text-emerald-600">
                  ₹{listing.currentPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pickup
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {store.address}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Collect before {listing.closingTime}.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Availability
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {listing.quantity} portion{listing.quantity === 1 ? "" : "s"}{" "}
                remaining
              </p>
            </div>
          </div>

          {message && (
            <p
              className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
              role="status"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isClaiming || listing.quantity <= 0 || Boolean(message)}
            className="mt-5 w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isClaiming
              ? "Reserving..."
              : message
                ? "Reservation Confirmed"
                : "Confirm Pickup Reservation"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

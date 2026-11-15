
"use client";

import { useState, type FormEvent } from "react";
import type { Store } from "../../types";

export interface NewListingInput {
  title: string;
  originalPrice: number;
  currentPrice: number;
  quantity: number;
  closingTime: string;
}

interface AddListingFormProps {
  store: Store;
  onAdd: (input: NewListingInput) => Promise<void>;
}

const inputClass =
  "mt-2 h-14 w-full rounded-xl border-2 border-stone-200 bg-white px-4 text-lg font-semibold text-stone-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export default function AddListingForm({
  store,
  onAdd,
}: AddListingFormProps) {
  const [title, setTitle] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [closingTime, setClosingTime] = useState(store.closingTime);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const original = Number(originalPrice);
    const current = Number(currentPrice);
    const count = Number(quantity);

    if (
      !title.trim() ||
      !Number.isFinite(original) ||
      !Number.isFinite(current) ||
      original <= 0 ||
      current <= 0 ||
      current >= original ||
      !Number.isInteger(count) ||
      count < 1 ||
      !closingTime
    ) {
      setError(
        "Please enter valid details. The discounted price must be lower than the original price."
      );
      return;
    }

    setSaving(true);

    try {
      await onAdd({
        title: title.trim(),
        originalPrice: original,
        currentPrice: current,
        quantity: count,
        closingTime,
      });

      setTitle("");
      setOriginalPrice("");
      setCurrentPrice("");
      setQuantity("1");
      setClosingTime(store.closingTime);
    } catch {
      setError("Unable to publish listing. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
          Quick listing
        </p>
        <h2 className="mt-1 text-2xl font-black text-stone-950">
          Add surplus food
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Give today's leftovers a second chance.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm font-bold text-stone-700">
          Item title
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chocolate Croissants"
            maxLength={70}
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold text-stone-700">
            Original price (₹)
            <input
              className={inputClass}
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="180"
              required
            />
          </label>

          <label className="block text-sm font-bold text-stone-700">
            Discounted price (₹)
            <input
              className={inputClass}
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              placeholder="90"
              required
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold text-stone-700">
            Quantity available
            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-bold text-stone-700">
            Pickup closes at
            <input
              className={inputClass}
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              required
            />
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="h-16 w-full rounded-xl bg-emerald-700 text-lg font-black text-white shadow-md transition hover:bg-emerald-800 active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? "Publishing..." : "+ Publish listing"}
        </button>
      </form>
    </section>
  );
}

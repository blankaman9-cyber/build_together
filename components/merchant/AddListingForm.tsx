"use client";

import { useState, type FormEvent } from "react";
import type { Store, Listing } from "../../types";

export interface NewListingInput {
  title: string;
  originalPrice: number;
  currentPrice: number;
  quantity: number;
  closingTime: string;
  category: "Bakery" | "Cafe" | "Snacks" | "Drinks" | "Grocery";
  pricingMode: "closing_time" | "expiry_date";
  expiryDate?: string;
}

interface AddListingFormProps {
  store: Store;
  onAdd: (input: NewListingInput) => Promise<void>;
}

const inputClass =
  "mt-2 h-13 w-full rounded-xl border-2 border-stone-200 bg-white px-4 text-base font-semibold text-stone-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export default function AddListingForm({
  store,
  onAdd,
}: AddListingFormProps) {
  const [title, setTitle] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [closingTime, setClosingTime] = useState(store.closingTime);
  const [category, setCategory] = useState<"Bakery" | "Cafe" | "Snacks" | "Drinks" | "Grocery">("Bakery");
  const [pricingMode, setPricingMode] = useState<"closing_time" | "expiry_date">("closing_time");

  // Default expiry date: tomorrow
  const tomorrowDefault = new Date(Date.now() + 86400 * 1000).toISOString().split("T")[0];
  const [expiryDate, setExpiryDate] = useState(tomorrowDefault);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Quick 1-tap presets including snacks and cold drinks
  const presets = [
    { name: "🥖 Sourdough Loaf", cat: "Bakery" as const, mode: "closing_time" as const, orig: 180, disc: 90, qty: 4 },
    { name: "🥐 Butter Croissants", cat: "Bakery" as const, mode: "closing_time" as const, orig: 200, disc: 100, qty: 5 },
    { name: "🥨 Kettle Chips Batch", cat: "Snacks" as const, mode: "expiry_date" as const, orig: 95, disc: 45, qty: 10 },
    { name: "🥤 Cold Brew (2-Pack)", cat: "Drinks" as const, mode: "expiry_date" as const, orig: 210, disc: 95, qty: 6 },
    { name: "🧃 Cold Pressed Juice", cat: "Drinks" as const, mode: "expiry_date" as const, orig: 150, disc: 55, qty: 5 },
    { name: "🎁 Mystery Grab-Bag", cat: "Bakery" as const, mode: "closing_time" as const, orig: 350, disc: 120, qty: 6 },
  ];

  function applyPreset(p: typeof presets[0]) {
    setTitle(p.name);
    setCategory(p.cat);
    setPricingMode(p.mode);
    setOriginalPrice(p.orig.toString());
    setCurrentPrice(p.disc.toString());
    setQuantity(p.qty.toString());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

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
        "Please enter valid details. Discounted price must be lower than original price."
      );
      return;
    }

    if (pricingMode === "expiry_date" && !expiryDate) {
      setError("Please select an expiry date for near-expiry inventory.");
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
        category,
        pricingMode,
        expiryDate: pricingMode === "expiry_date" ? expiryDate : undefined,
      });

      setTitle("");
      setOriginalPrice("");
      setCurrentPrice("");
      setQuantity("1");
      setClosingTime(store.closingTime);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Unable to publish listing. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
          Quick Listing Dashboard
        </p>
        <h2 className="mt-1 text-2xl font-black text-stone-950">
          Add Surplus or Near-Expiry Stock
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          List bakery leftovers, snacks, or cold drinks. Prices drop automatically as closing or expiry approaches.
        </p>
      </div>

      {/* 1-Tap Presets */}
      <div className="mb-5">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
          ⚡ 1-Tap Quick Presets
        </p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition active:scale-95"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category & Pricing Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Item Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="mt-1.5 h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3 text-sm font-semibold text-stone-900 outline-none focus:border-emerald-600"
            >
              <option value="Bakery">🥖 Bakery & Fresh Bakes</option>
              <option value="Cafe">☕ Cafe & Prepared Meals</option>
              <option value="Snacks">🥨 Packaged Snacks & Chips</option>
              <option value="Drinks">🥤 Cold Drinks & Beverages</option>
              <option value="Grocery">🛒 Dairy & Grocery</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Markdown Trigger
            </label>
            <select
              value={pricingMode}
              onChange={(e) => setPricingMode(e.target.value as any)}
              className="mt-1.5 h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3 text-sm font-semibold text-stone-900 outline-none focus:border-emerald-600"
            >
              <option value="closing_time">⏳ End-of-Day (Hourly Drop until Closing)</option>
              <option value="expiry_date">⏱️ Near-Expiry (Drops as Date Approaches)</option>
            </select>
          </div>
        </div>

        {/* Title */}
        <label className="block text-sm font-bold text-stone-700">
          Item Title / Pack
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cold Brew Bottles or Croissant 4-Pack"
            maxLength={70}
            required
          />
        </label>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold text-stone-700">
            Original Price (₹)
            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="180"
              required
            />
          </label>

          <label className="block text-sm font-bold text-stone-700">
            Starting Discount Price (₹)
            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              placeholder="90"
              required
            />
          </label>
        </div>

        {/* Quantity and Closing Time / Expiry Date */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-bold text-stone-700">
            Quantity In Stock
            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>

          {pricingMode === "expiry_date" ? (
            <label className="block text-sm font-bold text-stone-700">
              Expiry Date / Best Before
              <input
                className={inputClass}
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </label>
          ) : (
            <label className="block text-sm font-bold text-stone-700">
              Pickup Closes At
              <input
                className={inputClass}
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                required
              />
            </label>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 border border-red-200"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 border border-emerald-200"
          >
            ✓ Listing published to live customer feed & map!
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="h-14 w-full rounded-xl bg-emerald-700 text-base font-black text-white shadow-md transition hover:bg-emerald-800 active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? "Publishing..." : "+ Publish Stock Listing"}
        </button>
      </form>
    </section>
  );
}

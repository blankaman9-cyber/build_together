"use client";

import { useState } from "react";
import StoreFeed, {
  CategoryFilter,
} from "../components/customer/StoreFeed";

const categories: CategoryFilter[] = ["All", "Bakery", "Cafes", "< 2km"];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide text-emerald-600">
                FRESHSAVE
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Good food. Better prices.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Discover fresh surplus food from nearby stores before it goes
                to waste.
              </p>
            </div>

            <div className="hidden rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 sm:block">
              Local surplus marketplace
            </div>
          </div>
        </header>

        <section className="mb-6 space-y-4">
          <label htmlFor="marketplace-search" className="sr-only">
            Search food or stores
          </label>
          <div className="relative">
            <input
              id="marketplace-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search food, bakeries, cafes..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            >
              ⌕
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => {
              const active = category === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                  aria-pressed={active}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </section>

        <StoreFeed searchQuery={searchQuery} category={category} />
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { resetMockData } from "@/lib/storage";
import { useState } from "react";

export default function NavigationHeader() {
  const pathname = usePathname();
  const [resetMessage, setResetMessage] = useState(false);

  const handleReset = () => {
    resetMockData();
    setResetMessage(true);
    setTimeout(() => {
      setResetMessage(false);
      window.location.reload();
    }, 600);
  };

  const isCustomer = pathname === "/";
  const isMerchant = pathname.startsWith("/merchant");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-xl text-white shadow-sm transition group-hover:bg-emerald-700">
            🥐
          </span>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight">
              FreshSave
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Surplus Marketplace
            </span>
          </div>
        </Link>

        {/* View Switcher: Customer Feed vs Merchant Portal */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <nav className="flex items-center rounded-xl bg-slate-100 p-1">
            <Link
              href="/"
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                isCustomer
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🛒 Customer Feed
            </Link>
            <Link
              href="/merchant"
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                isMerchant
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏪 Merchant Portal
            </Link>
          </nav>

          {/* Demo Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset mock data to pristine state"
            className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            {resetMessage ? "Resetting..." : "🔄 Reset"}
          </button>
        </div>
      </div>
    </header>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import NavigationHeader from "./NavigationHeader";

export const metadata: Metadata = {
  title: "FreshSave - Hyper-Local Food Surplus Flash Marketplace",
  description:
    "Real-time dynamic markdown marketplace where bakeries and cafes drop food prices hourly before closing time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans flex flex-col">
        <NavigationHeader />

        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>

        <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-semibold text-slate-700">
              FreshSave · Hackathon MVP Prototype
            </p>
            <p className="text-slate-400">
              Saving delicious surplus food, one bakery at a time.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

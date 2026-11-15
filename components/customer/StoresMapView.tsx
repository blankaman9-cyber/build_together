"use client";

import { useEffect, useState, useMemo } from "react";
import type { Store, Listing } from "@/types";
import ListingCard from "./ListingCard";

interface StoresMapViewProps {
  stores: Store[];
  listings: Listing[];
  onSelectStore?: (storeId: string | null) => void;
  selectedStoreId?: string | null;
}

interface Coordinates {
  lat: number;
  lng: number;
}

// Calculate distance between two coordinates in km using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export default function StoresMapView({
  stores,
  listings,
  onSelectStore,
  selectedStoreId,
}: StoresMapViewProps) {
  // Default coordinates (Downtown center)
  const defaultCoords: Coordinates = { lat: 12.9716, lng: 77.5946 };
  const [userCoords, setUserCoords] = useState<Coordinates>(defaultCoords);
  const [locationLabel, setLocationLabel] = useState<string>("Downtown Center (Default)");
  const [addressInput, setAddressInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>("");
  const [showCoordInputs, setShowCoordInputs] = useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>("12.9716");
  const [manualLng, setManualLng] = useState<string>("77.5946");
  const [geoLocating, setGeoLocating] = useState<boolean>(false);

  const [activeStore, setActiveStore] = useState<Store | null>(
    stores.find((s) => s.id === selectedStoreId) || stores[0] || null
  );

  // Preset location shortcuts for demo
  const presets = [
    { name: "Downtown Center", lat: 12.9716, lng: 77.5946 },
    { name: "West End Bakes", lat: 12.9754, lng: 77.5912 },
    { name: "Arts District Cafe", lat: 12.9682, lng: 77.6015 },
    { name: "Metro Quick Mart", lat: 12.9738, lng: 77.5982 },
  ];

  const applyCoordinates = (lat: number, lng: number, label: string) => {
    setUserCoords({ lat, lng });
    setManualLat(lat.toFixed(4));
    setManualLng(lng.toFixed(4));
    setLocationLabel(label);
    setSearchError("");
  };

  // Browser Geolocation (GPS)
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLocating(true);
    setSearchError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        applyCoordinates(lat, lng, `My GPS Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
        setGeoLocating(false);
      },
      (err) => {
        setSearchError("Location permission denied. You can enter an address or coordinates above.");
        setGeoLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Address Geocoding or Direct Coordinates Parser
  const handleAddressSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = addressInput.trim();
    if (!query) return;

    setSearchError("");
    setIsSearching(true);

    // 1. Check if the user entered explicit comma-separated coordinates: "12.9716, 77.5946"
    const coordMatch = query.match(/^([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        applyCoordinates(lat, lng, `Custom Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setIsSearching(false);
        return;
      }
    }

    // 2. Otherwise geocode address via OpenStreetMap Nominatim Geocoding API
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );

      if (!res.ok) throw new Error("Network error contacting geocoding service.");
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const displayName = data[0].display_name.split(",").slice(0, 3).join(",");
        applyCoordinates(lat, lng, displayName);
      } else {
        setSearchError(`Could not locate "${query}". Try adding a city name or entering coordinates directly.`);
      }
    } catch (err) {
      // Fallback matching if offline or blocked
      setSearchError("Could not reach geocoding service. Please enter coordinates directly (e.g. 12.9716, 77.5946).");
    } finally {
      setIsSearching(false);
    }
  };

  // Manual Coordinates Submit
  const handleManualCoordsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setSearchError("Please enter valid latitude (-90 to 90) and longitude (-180 to 180).");
      return;
    }
    applyCoordinates(lat, lng, `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  };

  useEffect(() => {
    if (selectedStoreId) {
      const found = stores.find((s) => s.id === selectedStoreId);
      if (found) setActiveStore(found);
    }
  }, [selectedStoreId, stores]);

  // Compute stores with dynamic distances from userCoords
  const storesWithDistance = useMemo(() => {
    return stores.map((s) => {
      const lat = s.latitude || 12.9716;
      const lng = s.longitude || 77.5946;
      const liveDistance = calculateDistanceKm(userCoords.lat, userCoords.lng, lat, lng);
      const storeListings = listings.filter(
        (l) => l.storeId === s.id && l.status === "active" && l.quantity > 0
      );
      return {
        ...s,
        liveDistance,
        surplusCount: storeListings.length,
      };
    }).sort((a, b) => a.liveDistance - b.liveDistance);
  }, [stores, listings, userCoords]);

  // Map projection boundaries (lat/lng min/max)
  const bounds = useMemo(() => {
    const allLats = [...stores.map((s) => s.latitude || 12.9716), userCoords.lat];
    const allLngs = [...stores.map((s) => s.longitude || 77.5946), userCoords.lng];
    const minLat = Math.min(...allLats) - 0.005;
    const maxLat = Math.max(...allLats) + 0.005;
    const minLng = Math.min(...allLngs) - 0.005;
    const maxLng = Math.max(...allLngs) + 0.005;
    return { minLat, maxLat, minLng, maxLng };
  }, [stores, userCoords]);

  // Convert lat/long to percentage coordinates inside the map view
  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * 100;
    const y = 100 - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat || 1)) * 100;
    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(12, Math.min(88, y)),
    };
  };

  // Click on map to reposition coordinates
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width; // 0 to 1
    const clickY = (e.clientY - rect.top) / rect.height; // 0 to 1

    const lng = bounds.minLng + clickX * (bounds.maxLng - bounds.minLng);
    const lat = bounds.maxLat - clickY * (bounds.maxLat - bounds.minLat);

    applyCoordinates(lat, lng, `Pinned Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
  };

  const userPoint = project(userCoords.lat, userCoords.lng);

  // Active store's surplus listings
  const activeStoreListings = useMemo(() => {
    if (!activeStore) return [];
    return listings.filter(
      (l) => l.storeId === activeStore.id && l.status === "active" && l.quantity > 0
    );
  }, [activeStore, listings]);

  return (
    <div className="space-y-6">
      {/* Search Address / Coordinates Bar */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>📍</span>
              <span>Find Nearby Surplus by Address or Coordinates</span>
            </h2>
            <p className="text-xs text-slate-500">
              Enter any address, street, landmark, or coordinates (e.g. <span className="font-mono text-emerald-700">12.9716, 77.5946</span>) to recalculate distances.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestLocation}
              disabled={geoLocating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition active:scale-95 disabled:opacity-50"
            >
              <span>🎯</span>
              <span>{geoLocating ? "Getting GPS..." : "My Live GPS"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCoordInputs(!showCoordInputs)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              {showCoordInputs ? "Hide Coordinates" : "Exact Lat/Lng"}
            </button>
          </div>
        </div>

        {/* Address Search Form */}
        <form onSubmit={handleAddressSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Enter address, neighborhood, or 'lat, lng' (e.g. 142 Market St, or 12.9716, 77.5946)..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
          >
            {isSearching ? "Locating..." : "Locate"}
          </button>
        </form>

        {/* Exact Lat/Lng Coordinate Inputs (Expandable) */}
        {showCoordInputs && (
          <form onSubmit={handleManualCoordsSubmit} className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Latitude:</label>
              <input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="w-28 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Longitude:</label>
              <input
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="w-28 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              Update Map Pin
            </button>
          </form>
        )}

        {/* Current Active Location Pill & Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500">Current Center:</span>
            <span className="rounded-lg bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-200">
              📍 {locationLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Presets:</span>
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyCoordinates(p.lat, p.lng, p.name)}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {searchError && (
          <p className="rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-700 border border-red-200">
            {searchError}
          </p>
        )}
      </section>

      {/* Interactive Map Visual Board */}
      <div className="space-y-2">
        <div
          onClick={handleMapClick}
          title="Click anywhere on the map to place your pin"
          className="relative h-[360px] sm:h-[420px] w-full overflow-hidden rounded-3xl border border-slate-200 bg-[#e6eff5] shadow-inner cursor-crosshair select-none"
        >
          {/* Map Grid / Streets Styling */}
          <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Decorative Roads and Blocks */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none stroke-white/80" strokeWidth="8" fill="none">
            <path d="M 0,180 Q 200,160 450,220 T 900,190" />
            <path d="M 320,0 L 300,450" />
            <path d="M 680,0 Q 640,250 720,450" />
            <path d="M 0,320 L 900,280" strokeWidth="5" />
          </svg>

          {/* User Location Radar Marker */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
            style={{ left: `${userPoint.x}%`, top: `${userPoint.y}%` }}
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute h-10 w-10 animate-ping rounded-full bg-blue-500/30" />
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white shadow-md ring-4 ring-white">
                📍
              </span>
            </div>
            <span className="mt-1 block whitespace-nowrap rounded-md bg-blue-900/90 px-2 py-0.5 text-[9px] font-bold text-white shadow backdrop-blur-sm text-center">
              Your Coordinates
            </span>
          </div>

          {/* Store Pins on Map */}
          {storesWithDistance.map((s) => {
            const lat = s.latitude || 12.9716;
            const lng = s.longitude || 77.5946;
            const pt = project(lat, lng);
            const isSelected = activeStore?.id === s.id;

            return (
              <div
                key={s.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-200"
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent map click reposition
                    setActiveStore(s);
                    onSelectStore?.(s.id);
                  }}
                  className={`group flex flex-col items-center transition active:scale-95 ${
                    isSelected ? "scale-110 z-40" : "hover:scale-105"
                  }`}
                >
                  {/* Store Pin Head */}
                  <div
                    className={`relative flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 shadow-lg border-2 transition ${
                      isSelected
                        ? "bg-emerald-600 text-white border-white ring-4 ring-emerald-300"
                        : "bg-white text-slate-800 border-slate-200 hover:border-emerald-400"
                    }`}
                  >
                    <span className="text-sm select-none">
                      {s.category === "Bakery"
                        ? "🥖"
                        : s.category === "Cafe"
                        ? "☕"
                        : "🥤"}
                    </span>
                    <div className="text-left">
                      <p className="text-[11px] font-black leading-tight max-w-[120px] truncate">
                        {s.name}
                      </p>
                      <p
                        className={`text-[9px] font-semibold leading-none mt-0.5 ${
                          isSelected ? "text-emerald-100" : "text-slate-400"
                        }`}
                      >
                        {s.liveDistance} km · {s.surplusCount} surplus
                      </p>
                    </div>

                    {s.surplusCount > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                          isSelected ? "bg-white text-emerald-700" : "bg-emerald-500 text-white"
                        }`}
                      >
                        {s.surplusCount}
                      </span>
                    )}
                  </div>

                  {/* Arrow Pointer */}
                  <div
                    className={`h-2 w-2 rotate-45 -mt-1 shadow-sm ${
                      isSelected ? "bg-emerald-600" : "bg-white"
                    }`}
                  />
                </button>
              </div>
            );
          })}

          {/* Hint Overlay */}
          <div className="absolute top-3 left-3 z-30 rounded-xl bg-white/90 backdrop-blur-md px-3 py-1.5 shadow-sm border border-slate-200/80 text-[11px] text-slate-600 font-medium">
            💡 <em>Click anywhere on map to drop pin, or tap a store to see surplus food</em>
          </div>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-30 rounded-xl bg-white/95 backdrop-blur-md p-2.5 shadow-md border border-slate-200/80 text-[10px] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span>You: ({userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)})</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <span>Surplus Partner Stores (Tap to View)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Store Surplus Detail Drawer */}
      {activeStore && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl select-none">
                  {activeStore.category === "Bakery"
                    ? "🥖"
                    : activeStore.category === "Cafe"
                    ? "☕"
                    : "🥤"}
                </span>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {activeStore.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    📍 {activeStore.address} · Closes at {activeStore.closingTime}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Google Maps External Directions Link */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${activeStore.name} ${activeStore.address}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <span>🗺️ Open in Google Maps ↗</span>
              </a>

              <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                {activeStoreListings.length} Surplus Items Active
              </span>
            </div>
          </div>

          {/* Surplus Items For This Store */}
          {activeStoreListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm font-bold text-slate-700">
                No active surplus listings right now for {activeStore.name}.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                New surplus batches are usually added closer to closing time.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Items Available at this Location (Dynamic Markdown Active)
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {activeStoreListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    store={activeStore}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

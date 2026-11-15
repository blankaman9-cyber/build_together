"use client";

import { useMemo, useState } from "react";
import { getPriceHistoryAndSchedule, PricePoint } from "@/utils/pricing";

interface PriceHistoryGraphProps {
  originalPrice: number;
  createdAt?: string;
  closingTime: string;
  expiryDate?: string;
  className?: string;
  compact?: boolean;
}

export default function PriceHistoryGraph({
  originalPrice,
  createdAt = new Date(Date.now() - 3600000 * 2).toISOString(),
  closingTime,
  expiryDate,
  className = "",
  compact = false,
}: PriceHistoryGraphProps) {
  const [selectedPoint, setSelectedPoint] = useState<PricePoint | null>(null);

  const history = useMemo(() => {
    return getPriceHistoryAndSchedule(originalPrice, createdAt, closingTime, 6, expiryDate);
  }, [originalPrice, createdAt, closingTime, expiryDate]);

  const { points, currentPrice, currentDiscount, floorPrice, isExpiryMode } = history;

  // SVG Chart Dimensions
  const width = compact ? 320 : 480;
  const height = compact ? 120 : 160;
  const paddingX = compact ? 25 : 40;
  const paddingY = compact ? 20 : 25;

  const minPrice = floorPrice * 0.9;
  const maxPrice = originalPrice * 1.05;

  // Calculate coordinates for SVG
  const chartPoints = useMemo(() => {
    return points.map((p, index) => {
      const x = paddingX + (index / (points.length - 1 || 1)) * (width - paddingX * 2);
      const normalizedY = (p.price - minPrice) / (maxPrice - minPrice || 1);
      const y = height - paddingY - normalizedY * (height - paddingY * 2);
      return { ...p, x, y };
    });
  }, [points, width, height, paddingX, paddingY, minPrice, maxPrice]);

  // Construct SVG Path for the curve
  const pathD = useMemo(() => {
    if (chartPoints.length === 0) return "";
    return chartPoints.reduce((acc, pt, index) => {
      if (index === 0) return `M ${pt.x} ${pt.y}`;
      const prev = chartPoints[index - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, "");
  }, [chartPoints]);

  const areaD = useMemo(() => {
    if (chartPoints.length === 0) return "";
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const baselineY = height - paddingY;
    return `${pathD} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [pathD, chartPoints, height, paddingY]);

  const activePoint = selectedPoint || chartPoints.find((p) => p.isCurrent) || chartPoints[0];

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {isExpiryMode ? "⏱️ Near-Expiry Markdown" : "📉 Dynamic Markdown Curve"}
          </span>
          <h4 className="text-sm font-black text-slate-900 mt-1">
            {isExpiryMode ? "Prices Drop As Expiry Approaches" : "Prices Drop As Closing Nears"}
          </h4>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400 font-medium">Current Price</p>
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="text-lg font-black text-emerald-600">
              ₹{currentPrice}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              -{currentDiscount}%
            </span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden flex justify-center py-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[160px] overflow-visible"
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#f1f5f9"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#e2e8f0"
          />

          {/* Gradient area */}
          <path d={areaD} fill="url(#priceGradient)" />

          {/* Main Price curve line */}
          <path
            d={pathD}
            fill="none"
            stroke="#059669"
            strokeWidth={compact ? 2.5 : 3.5}
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Points */}
          {chartPoints.map((pt, i) => (
            <g
              key={i}
              className="cursor-pointer transition-all"
              onClick={() => setSelectedPoint(pt)}
              onMouseEnter={() => setSelectedPoint(pt)}
            >
              {pt.isCurrent && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={compact ? 8 : 11}
                  fill="#10b981"
                  fillOpacity="0.25"
                  className="animate-ping"
                />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={pt.isCurrent ? (compact ? 5 : 6.5) : (compact ? 3.5 : 4.5)}
                fill={pt.isCurrent ? "#059669" : pt.isPast ? "#94a3b8" : "#10b981"}
                stroke="#ffffff"
                strokeWidth={2}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Interactive Inspector Pill */}
      {activePoint && (
        <div className="mt-2 rounded-xl bg-slate-50 border border-slate-100 p-2.5 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800">
              {activePoint.timeLabel}
            </span>
            {activePoint.isCurrent && (
              <span className="ml-1.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-black uppercase text-white">
                Now
              </span>
            )}
            {activePoint.isFuture && (
              <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                Projected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 line-through text-[11px]">
              ₹{originalPrice}
            </span>
            <span className="font-black text-emerald-700 text-sm">
              ₹{activePoint.price}
            </span>
            <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
              -{activePoint.discountPercent}%
            </span>
          </div>
        </div>
      )}

      {/* Timeline Steps / Hourly or Daily Drop Bar */}
      {!compact && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-[10px]">
          {chartPoints.map((pt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedPoint(pt)}
              className={`rounded-lg p-1.5 border transition ${
                activePoint && pt.timestamp === activePoint.timestamp
                  ? "bg-emerald-50 border-emerald-400 font-bold text-emerald-950 shadow-sm"
                  : pt.isPast
                  ? "bg-slate-50 border-slate-200 text-slate-400"
                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <p className="truncate font-medium">{pt.timeFormatted}</p>
              <p className="font-black text-xs mt-0.5 text-emerald-600">
                ₹{pt.price}
              </p>
              <p className="text-[9px] text-slate-500">
                -{pt.discountPercent}%
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Explanatory footer */}
      <p className="mt-2.5 text-[11px] text-slate-500 leading-snug">
        💡 <strong>Pro Tip:</strong> {isExpiryMode
          ? `Stock gets cheaper as it nears expiry date (${expiryDate}). Snag it before someone else does!`
          : `Prices continue dropping until closing at ${closingTime} (up to 70% off), but batches sell fast!`}
      </p>
    </div>
  );
}

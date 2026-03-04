import React, { useState } from "react";
import {
  Plane,
  Hotel,
  Utensils,
  Bus,
  Ticket,
  FileCheck,
  Wallet,
  TrendingUp,
  Users,
  User,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

// ─── Config: icon + color per category key ───────────────────────────────────
const CATEGORY_CONFIG = {
  flights: {
    label: "Flights",
    icon: Plane,
    color: "#6366f1",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-600 dark:text-indigo-400",
    bar: "bg-indigo-500",
  },
  accommodation: {
    label: "Accommodation",
    icon: Hotel,
    color: "#0ea5e9",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-600 dark:text-sky-400",
    bar: "bg-sky-500",
  },
  food: {
    label: "Food",
    icon: Utensils,
    color: "#f59e0b",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-400",
  },
  localTransport: {
    label: "Local Transport",
    icon: Bus,
    color: "#10b981",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  activities: {
    label: "Activities",
    icon: Ticket,
    color: "#ec4899",
    bg: "bg-pink-50 dark:bg-pink-950/40",
    text: "text-pink-600 dark:text-pink-400",
    bar: "bg-pink-500",
  },
  visa: {
    label: "Visa",
    icon: FileCheck,
    color: "#8b5cf6",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-600 dark:text-violet-400",
    bar: "bg-violet-500",
  },
  miscellaneous: {
    label: "Miscellaneous",
    icon: Wallet,
    color: "#64748b",
    bg: "bg-slate-50 dark:bg-slate-800/60",
    text: "text-slate-600 dark:text-slate-400",
    bar: "bg-slate-400",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (amount, currency) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency ?? "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const StatusBadge = ({ status }) => {
  const map = {
    within: {
      label: "Within Budget",
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    },
    over: {
      label: "Over Budget",
      cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    },
    tight: {
      label: "Tight Budget",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    },
  };
  const { label, cls } = map[status] ?? map.within;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
};

// ─── SVG Donut ────────────────────────────────────────────────────────────────
const DonutChart = ({ slices, total, currency, dailyAvg }) => {
  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;

  const segments = slices
    .filter((s) => s.average > 0)
    .map((s) => {
      const pct = s.average / total;
      const dash = pct * C;
      const gap = C - dash;
      const seg = { ...s, dash, gap, offset };
      offset += dash;
      return seg;
    });

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        className="-rotate-90"
      >
        {/* track */}
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-slate-800"
          strokeWidth="16"
        />
        {segments?.map((s, i) => (
          <circle
            key={i}
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="16"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">
          Total
        </span>
        <span className="text-base font-black text-slate-900 dark:text-white leading-tight">
          {fmt(total, currency)}
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">
          ~{fmt(dailyAvg, currency)}/day
        </span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Budget({ budget }) {
  const [view, setView] = useState("person"); // "person" | "group"
  const [showAssumptions, setShowAssumptions] = useState(false);

  if (!budget) return null;

  const {
    currency = "INR",
    breakdown = {},
    totalEstimatedCostPerPerson = {},
    totalEstimatedCostForGroup = {},
    seasonalAdjustment = {},
    dailyAverageCostPerPerson = 0,
    budgetStatus = "within",
    assumptions = [],
  } = budget;

  const isGroup = view === "group";
  const totals = isGroup
    ? totalEstimatedCostForGroup
    : totalEstimatedCostPerPerson;
  const totalAvg = totals?.average;

  // Build enriched breakdown array
  const categories = Object?.entries(breakdown)?.map(([key, values]) => ({
    key,
    ...values,
    ...(CATEGORY_CONFIG[key] ?? {
      label: key,
      icon: Wallet,
      color: "#94a3b8",
      bg: "bg-slate-50",
      text: "text-slate-500",
      bar: "bg-slate-400",
    }),
  }));

  const maxAvg = Math.max(...categories.map((c) => c.average));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Budget Breakdown
          </h3>
          <StatusBadge status={budgetStatus} />
        </div>

        {/* Person / Group toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
          {[
            { key: "person", icon: User, label: "Per Person" },
            { key: "group", icon: Users, label: "Group" },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                view === key
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* ── Donut + min/max ── */}
        <div className="flex items-center gap-6">
          <DonutChart
            slices={categories}
            total={totalAvg}
            currency={currency}
            dailyAvg={dailyAverageCostPerPerson}
          />
          <div className="flex-1 space-y-2">
            {[
              {
                label: "Min",
                val: totals.min,
                cls: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Avg",
                val: totals.average,
                cls: "text-slate-900 dark:text-white font-bold",
              },
              {
                label: "Max",
                val: totals.max,
                cls: "text-red-500 dark:text-red-400",
              },
            ].map(({ label, val, cls }) => (
              <div
                key={label}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wide font-semibold">
                  {label}
                </span>
                <span className={`font-semibold ${cls}`}>
                  {fmt(val, currency)}
                </span>
              </div>
            ))}

            {/* Seasonal tag */}
            {seasonalAdjustment && (
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <TrendingUp className="w-3 h-3 text-slate-400" />
                <span className="text-[11px] text-slate-400 capitalize">
                  {seasonalAdjustment.season} season · ×
                  {seasonalAdjustment.multiplierApplied}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Per-category rows ── */}
        <div className="space-y-2.5">
          {categories.map((cat) => {
            const {
              key,
              label,
              icon: Icon,
              bg,
              text,
              bar,
              min,
              max,
              average,
              color,
            } = cat;
            const pct = maxAvg > 0 ? (average / maxAvg) * 100 : 0;
            const isFree = average === 0;

            return (
              <div key={key} className="group">
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className={`shrink-0 size-8 rounded-lg flex items-center justify-center ${bg}`}
                  >
                    <Icon className={`w-4 h-4 ${text}`} />
                  </div>

                  {/* Label + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isFree ? (
                          <span className="text-xs font-bold text-emerald-500">
                            Free
                          </span>
                        ) : (
                          <>
                            <span className="text-xs text-slate-400">
                              {fmt(min, currency)}–{fmt(max, currency)}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {fmt(average, currency)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Assumptions accordion ── */}
        {assumptions.length > 0 && (
          <div className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowAssumptions((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                Assumptions ({assumptions.length})
              </div>
              {showAssumptions ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            {showAssumptions && (
              <ul className="px-4 pb-3 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                {assumptions.map((a, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-xs text-slate-500 dark:text-slate-400"
                  >
                    <span className="text-slate-300 dark:text-slate-600 shrink-0">
                      •
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

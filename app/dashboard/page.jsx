"use client";

import { useSession } from "@/lib/auth-client";
import { useSelector } from "react-redux";
import { selectUserProfile, selectSubscriptionDetails, selectIsUserInitialized } from "@/lib/redux/slices/userSlice";
import { selectAllChats } from "@/lib/redux/slices/chatsSlice";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Heart,
  CreditCard,
  User,
  Plus,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

const PLAN_LIMITS = { free: 2, basic: 10, premium: 30 };

const CARD_GRADIENTS = [
  "from-purple-500/50 to-indigo-600/60",
  "from-rose-500/50 to-orange-500/60",
  "from-emerald-500/50 to-teal-600/60",
  "from-sky-500/50 to-blue-600/60",
  "from-amber-400/50 to-yellow-500/60",
  "from-pink-500/50 to-rose-600/60",
];

function getInitials(str) {
  if (!str) return "?";
  return str
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function TripCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
      <div className="h-48 bg-muted" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="mt-4 pt-4 border-t border-border flex justify-between">
          <div className="h-3 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip, index, total }) {
  const destination = trip.input?.destination ?? "Unknown Destination";
  const origin = trip.input?.origin ?? "";
  const startDate = trip.input?.startDate ?? null;
  const endDate = trip.input?.endDate ?? null;
  const days = trip.derived?.numberOfDays ?? null;
  const tripId = trip.tripId;
  const imageUrl = trip.places?.attractions?.[0]?.images?.[0] ?? null;
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  const fmtShort = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
  const fmtFull = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

  return (
    <Link href={`/view-trip/${tripId}`}>
      <article className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full cursor-pointer">
        {/* Image / Placeholder */}
        <div className="relative h-48 w-full overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={destination}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <span className="text-5xl font-black text-white/20 select-none tracking-tight">
                {getInitials(destination)}
              </span>
            </div>
          )}
          {/* Trip number badge */}
          <span className="absolute top-3 right-3 z-20 bg-background/80 backdrop-blur-sm text-foreground px-2 py-1 rounded text-xs font-bold">
            #{total - index}
          </span>
          {/* Destination overlay */}
          <div className="absolute bottom-3 left-3 z-20 text-white pr-2">
            <h3 className="font-bold text-lg drop-shadow-md leading-tight line-clamp-1">
              {destination}
            </h3>
            {origin && (
              <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                from {origin}
              </p>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-4 gap-2">
            {startDate && endDate ? (
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Dates
                </span>
                <span className="text-sm font-medium truncate">
                  {fmtShort(startDate)} – {fmtFull(endDate)}
                </span>
              </div>
            ) : (
              <div />
            )}
            {days != null && (
              <div className="flex flex-col gap-0.5 items-end shrink-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Duration
                </span>
                <span className="text-sm font-medium">
                  {days} {days === 1 ? "Day" : "Days"}
                </span>
              </div>
            )}
          </div>
          <div className="mt-auto pt-4 border-t border-border flex justify-end">
            <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
              View Details
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { name = "", profileImage = "" } = useSelector(selectUserProfile);
  const { subscriptionPlan, subscriptionEndDate, monthlyTripCount } = useSelector(selectSubscriptionDetails);
  const trips = useSelector(selectAllChats);
  const isInitialized = useSelector(selectIsUserInitialized);

  const [visibleCount, setVisibleCount] = useState(3);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/restricted");
    }
  }, [status, router]);

  const handleNewTrip = () => router.push(`/create-trip/${crypto.randomUUID()}`);

  const planLimit = PLAN_LIMITS[subscriptionPlan] ?? 2;
  const usagePercent = Math.min((monthlyTripCount / planLimit) * 100, 100);
  const planLabel =
    subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1);
  const tripCount = trips.length;

  const navItems = [
    { Icon: MapPin, label: "My Trips", href: "/dashboard", active: true, disabled: false },
    { Icon: Heart, label: "Saved Places", href: "#", active: false, disabled: true },
    { Icon: CreditCard, label: "Subscription", href: "/pricing", active: false, disabled: false },
    { Icon: User, label: "Account", href: "/dashboard", active: false, disabled: false },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <main className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ───── Sidebar ───── */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          {/* Profile Card */}
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={name || "User"}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-bold text-xl">
                    {getInitials(name)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-lg leading-tight truncate">
                  {name || "Traveler"}
                </h2>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {planLabel} Plan
                </span>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-1 mb-6">
              {navItems.map(({ Icon, label, href, active, disabled }) =>
                disabled ? (
                  <span
                    key={label}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-muted-foreground opacity-40 cursor-not-allowed select-none"
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {label}
                  </span>
                ) : (
                  <Link
                    key={label}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {label}
                  </Link>
                )
              )}
            </nav>

            {/* Usage bar */}
            <div className="bg-secondary/30 rounded-xl p-4 border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Monthly Usage
                </span>
                <span className="text-xs font-bold">
                  {monthlyTripCount}/{planLimit} this month
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Resets on the 1st of next month.{" "}
                <Link href="/pricing" className="text-primary hover:underline">
                  Upgrade
                </Link>{" "}
                for more.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold">{tripCount}</span>
              <span className="text-xs text-muted-foreground font-medium mt-0.5">
                Total Trips
              </span>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold leading-tight">{planLabel}</span>
              <span className="text-xs text-muted-foreground font-medium mt-0.5">
                Current Plan
              </span>
            </div>
          </div>
        </aside>

        {/* ───── Main Content ───── */}
        <section className="lg:col-span-9 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Your Trips</h1>
            <Button size="sm" className="flex items-center gap-2 group" onClick={handleNewTrip}>
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              Create New Trip
            </Button>
          </div>

          {/* Trip Grid / Skeleton / Empty */}
          {!isInitialized && status !== "unauthenticated" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <TripCardSkeleton />
              <TripCardSkeleton />
              <TripCardSkeleton />
            </div>
          ) : trips.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {trips.slice(0, visibleCount).map((trip, idx) => (
                  <TripCard
                    key={trip.tripId ?? idx}
                    trip={trip}
                    index={idx}
                    total={trips.length}
                  />
                ))}
              </div>
              {trips.length > visibleCount && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setVisibleCount((c) => c + 3)}
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    Load More Trips
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                You haven&apos;t created any trips yet. Start planning your next adventure!
              </p>
              <Button onClick={handleNewTrip}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Trip
              </Button>
            </div>
          )}
        </section>
      </main>

      {/* Mobile FAB */}
      <button
        onClick={handleNewTrip}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all"
        aria-label="Create new trip"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
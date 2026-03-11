"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ViewTripError({ error, reset }) {
  useEffect(() => {
    console.error("[ViewTripErrorBoundary]", error?.message || error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-xl w-full border rounded-2xl p-6 text-center bg-background">
        <h2 className="text-2xl font-semibold">Unable to load this trip view</h2>
        <p className="mt-3 text-muted-foreground">
          Something unexpected happened while rendering this trip. You can try again,
          return to your dashboard, or create a new trip.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-md border hover:bg-muted transition-colors"
          >
            Go to dashboard
          </Link>
          <Link
            href="/create-trip"
            className="px-4 py-2 rounded-md border hover:bg-muted transition-colors"
          >
            Create trip
          </Link>
        </div>
      </div>
    </div>
  );
}

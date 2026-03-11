"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[GlobalErrorBoundary]", error?.message || error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-xl w-full border rounded-2xl p-6 text-center bg-background">
            <h2 className="text-2xl font-semibold">Something went wrong</h2>
            <p className="mt-3 text-muted-foreground">
              An unexpected error occurred. Please try reloading this view.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => reset()}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

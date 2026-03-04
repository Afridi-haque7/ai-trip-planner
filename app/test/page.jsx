'use client';

import React, { useState } from 'react';
import Overview from '@/components/form/results/Overview';
import Itinerary from '@/components/form/results/Itinerary';
import Attractions from '@/components/form/results/Attractions';
import Budget from '@/components/form/results/Budget';

export default function TestPage() {
  const [currentDay, setCurrentDay] = useState(1);

  return (
    <div className="relative mt-20 mb-12 flex min-h-screen w-full flex-col overflow-x-hidden bg-white dark:bg-slate-950">
      {/* Main Content */}
      <main className="flex flex-1 justify-center py-8 px-4 sm:px-8">
        <div className="flex w-full max-w-[1280px] gap-8 flex-col lg:flex-row">
          {/* Main Content Column */}
          <div className="flex flex-1 flex-col gap-8">
            {/* Overview Component */}
            <Overview />

            {/* Itinerary Component */}
            <div>
              <Itinerary currentDay={currentDay} setCurrentDay={setCurrentDay} />
            </div>

            {/* Attractions Component */}
            <div>
              <Attractions />
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="w-full lg:w-[360px] flex flex-col gap-6 shrink-0 m-0 p-0 -top-8">
            {/* Budget Component */}
            <Budget />

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex gap-3">
                <span className="text-xl">ℹ️</span>
                <div>
                  <h4 className="font-bold text-sm text-blue-900 dark:text-blue-100 mb-1">Test Page Info</h4>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    This page displays all 4 result components in a dashboard layout. Overview and Itinerary on the left, Attractions in the center, and Budget sidebar on the right.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

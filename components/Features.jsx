"use client";

import dynamic from "next/dynamic";

const StickyFeatures = dynamic(() => import("@/components/StickyFeatures.jsx"));
const FeaturesSeaction = () => {
  return (
    <>
      <div>
        <div className="w-full max-w-7xl mx-auto py-4 lg:py-8 flex justify-center items-center">
          <StickyFeatures />
        </div>
      </div>
    </>
  );
};

export default FeaturesSeaction;

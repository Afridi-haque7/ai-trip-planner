"use client";
import dynamic from "next/dynamic";
const ThreeDMarquee = dynamic(() => import("@/components/ui/3d-marquee"));

// Title component
const TitleComponent = () => {
  return (
    <div className="w-full flex flex-col items-center gap-2 md:gap-8 -mt-32">
      <h1 className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b  from-gray-100 to-black bg-clip-text text-center text-3xl md:text-5xl lg:text-6xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10">
        PLAN YOUR NEXT ADVENTURE
      </h1>
      <h1 className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b  from-gray-100 to-black bg-clip-text text-center text-3xl md:text-5xl lg:text-6xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10">
        WITH THE HELP OF AI
      </h1>
    </div>
  );
};
const ThreeDMarqueeDemoSecond = () => {
  const images = [
    "https://images.unsplash.com/photo-1642039673605-6c86ad03c4ed?q=80&w=735&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1579549322334-324325a6540b?q=80&w=735&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542144612-1b3641ec3459?q=80&w=687&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1650747858910-5d48a4116296?q=80&w=687&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593078875274-446ed98bae67?q=80&w=686&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1674108887401-a696b3e9c3a7?q=80&w=736&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1535117399959-7df1714b4202?q=80&w=687&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509219411165-3ec3195b4842?q=80&w=682&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1525856331869-3d345509b9fb?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593078875338-32c0283b0fee?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1750961093359-6bc630b9e9b5?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1738666428524-7e61a877f8d0?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1691055657038-cac5a5930821?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1642039673605-6c86ad03c4ed?q=80&w=735&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1579549322334-324325a6540b?q=80&w=735&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542144612-1b3641ec3459?q=80&w=687&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1650747858910-5d48a4116296?q=80&w=687&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593078875274-446ed98bae67?q=80&w=686&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1674108887401-a696b3e9c3a7?q=80&w=736&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1535117399959-7df1714b4202?q=80&w=687&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509219411165-3ec3195b4842?q=80&w=682&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1525856331869-3d345509b9fb?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593078875338-32c0283b0fee?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1750961093359-6bc630b9e9b5?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1738666428524-7e61a877f8d0?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1691055657038-cac5a5930821?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1642039673605-6c86ad03c4ed?q=80&w=735&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1579549322334-324325a6540b?q=80&w=735&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542144612-1b3641ec3459?q=80&w=687&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1650747858910-5d48a4116296?q=80&w=687&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593078875274-446ed98bae67?q=80&w=686&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1674108887401-a696b3e9c3a7?q=80&w=736&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1535117399959-7df1714b4202?q=80&w=687&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509219411165-3ec3195b4842?q=80&w=682&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1525856331869-3d345509b9fb?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593078875338-32c0283b0fee?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1750961093359-6bc630b9e9b5?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1738666428524-7e61a877f8d0?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1691055657038-cac5a5930821?w=600&auto=format&fit=crop",
  ];
  return (
    <div className="max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-4xl xl:max-w-6xl scale-75 lg:scale-100 flex justify-center rounded-3xl bg-gray-950/5 ring-neutral-700/10 dark:bg-neutral-800 overflow-hidden">
      <ThreeDMarquee images={images} />
    </div>
  );
};

export default function HeroSection() {
  return (
    <>
      <div className="w-full flex flex-col items-center justify-center p-2 gap-2 lg:px-2 md:gap-8">
        <TitleComponent />
        <ThreeDMarqueeDemoSecond
          className={`scale-50 sm:scale-75 lg:scale-100`}
        />
      </div>
    </>
  );
}

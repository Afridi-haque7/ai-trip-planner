"use client";
import dynamic from "next/dynamic";
import { ReactLenis, useLenis } from "lenis/react";

const HeroSection = dynamic(() => import("@/components/HeroSection"));
const FeaturesSeaction = dynamic(() => import("@/components/Features.jsx"));
const Footer = dynamic(() => import("@/components/Footer.jsx"));

export default function Home() {
  return (
    <>
      <ReactLenis root />
      <div className="w-full flex flex-col justify-center items-center">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="w-full flex justify-center items-center mt-56 ">
          <HeroSection />
        </div>
        <div className="w-full flex justify-center items-center">
          <FeaturesSeaction />
        </div>
        <div className="w-full mt-12">
          <Footer />
        </div>
      </div>
    </>
  );
}

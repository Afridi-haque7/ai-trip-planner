"use client";
import dynamic from "next/dynamic";
import {images} from "@/constants/index";
const ThreeDMarquee = dynamic(() => import("@/components/ui/3d-marquee"));
const TextGenerateEffect = dynamic(() => import("@/components/ui/text-generate-effect"));

// Title component
const TitleComponent = () => {
  const words = "Plan Your Next Adventure With The Help of AI";
  return (
    <div className="w-full flex flex-col items-center gap-2 md:gap-8 -mt-24 mb-12">
      <TextGenerateEffect words={words} className={`text-foreground `} />
    </div>
  );
};
const ThreeDMarqueeDemoSecond = () => {
  return (
    <div className="max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-4xl xl:max-w-6xl scale-75 lg:scale-100 flex justify-center rounded-3xl bg-card ring-border overflow-hidden">
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
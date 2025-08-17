"use client";
import dynamic from "next/dynamic";
import { ReactLenis, useLenis } from "lenis/react";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconBrandGithub,
  IconBrandX,
  IconExchange,
  IconHome,
  IconNewSection,
  IconTerminal2,
} from "@tabler/icons-react";


const HeroSection = dynamic(() => import("@/components/HeroSection"));
const FeaturesSeaction = dynamic(() => import("@/components/Features.jsx"));
const Footer = dynamic(() => import("@/components/Footer.jsx"));

  const links = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/",
    },
    {
      title: "Generate Trip",
      icon: (
        <IconNewSection className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/create-trip",
    },
    {
      title: "Dashboard",
      icon: (
        <img
          src="https://assets.aceternity.com/logo-dark.png"
          width={20}
          height={20}
          alt="Aceternity Logo"
        />
      ),
      href: "/dashboard",
    },
    {
      title: "Pricing",
      icon: (
        <IconExchange className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/pricing",
    },
 
    {
      title: "Twitter",
      icon: (
        <IconBrandX className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/",
    },
    {
      title: "Instagram",
      icon: (
        <IconBrandGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/",
    },
  ];

export default function Home() {
  return (
    <>
      <ReactLenis root />
      <div className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2">
        <FloatingDock
          items={links}
          desktopClassName={`bg-transparent backdrop-blur-sm`}
          mobileClassName={`backdrop-blur-sm`}
        />
      </div>
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

"use client";
import { cn } from "@/lib/utils";
import { motion, useMotionTemplate } from "motion/react";
import React from "react";

export const HeroHighlight = ({ children, className, containerClassName }) => {
  return (
    <div
      className={cn(
        "group relative flex h-[40rem] w-full items-center justify-center bg-transparent",
        containerClassName
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 hidden"
        
      />
      <div
        className="pointer-events-none absolute inset-0 block"
      />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 dark:hidden"
        style={{
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              black 0%,
              transparent 100%
            )
          `,
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 hidden opacity-0 transition duration-300 group-hover:opacity-100 dark:block"
        style={{
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              black 0%,
              transparent 100%
            )
          `,
        }}
      />
      <div className={cn("relative z-20", className)}>{children}</div>
    </div>
  );
};

export const Highlight = ({ children, className }) => {
  return (
    <motion.span
      initial={{
        backgroundSize: "0% 100%",
      }}
      animate={{
        backgroundSize: "100% 100%",
      }}
      transition={{
        duration: 2,
        ease: "linear",
        delay: 0.5,
      }}
      style={{
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: "inline",
      }}
      className={cn(
        `relative inline-block rounded-lg bg-gradient-to-r from-indigo-700 to-purple-700 px-1 pb-1 dark:from-indigo-500 dark:to-purple-500`,
        className
      )}
    >
      {children}
    </motion.span>
  );
};

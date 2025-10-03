"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import crypto from "crypto";
import { ReactLenis } from "lenis/react";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
const TypewriterEffectSmooth = dynamic(() =>
  import("@/components/ui/typewriter-effect.jsx")
);
const HoverBorderGradient = dynamic(() =>
  import("@/components/ui/hover-border-gradient.jsx")
);
import { motion } from "motion/react";
import { MorphingText } from "@/components/magicui/morphing-text";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards.jsx";
import { testimonials } from "@/constants";
import Image from "next/image";
import { HeroHighlight, Highlight } from "./ui/hero-highlight";
import { redirectIfUnauthenticated } from "@/app/helper";
const TypewriterEffectSmoothDemo = () => {
  const words = [
    {
      text: "Introducing",
    },
    {
      text: "Trip",
      className: "text-blue-500",
    },
    {
      text: "Tailor,",
      className: "text-blue-500",
    },
    {
      text: "your",
    },
    {
      text: "AI",
    },
    {
      text: "travel",
    },
    {
      text: "companion",
    },
  ];
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <p className="text-neutral-200 dark:text-neutral-200 text-sm sm:text-base  ">
        The wait is over!
      </p>
      <TypewriterEffectSmooth words={words} />
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4">
        <HoverBorderGradient
          containerClassName="rounded-full"
          as="button"
          className="bg-black text-white flex items-center space-x-2"
          onClick={() => redirectIfUnauthenticated(session, router)}
          disabled={isLoading}
        >
          <span>Get Started</span>
          <ArrowRight />
        </HoverBorderGradient>
      </div>
    </div>
  );
};

const StickyFeatures = () => {
  return (
    <ReactLenis root>
      <main className="bg-black rounded-lg max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto w-full ">
        <div className="wrapper">
          <section className="text-white h-screen w-full bg-[#0a0a0a] grid place-content-center sticky top-0 overflow-x-hidden">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            <TypewriterEffectSmoothDemo />
          </section>

          <section className="bg-gray-300 text-black  grid place-content-center h-screen sticky top-0 rounded-tr-2xl rounded-tl-2xl overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            <h1 className="xl:text-6xl md:text-4xl text-3xl px-8 font-semibold text-center tracking-tight leading-[120%]">
              Confused about planning your next trip? 🤔 <br />
              We got you covered! 🤩
            </h1>
          </section>

          <section className="text-white h-screen w-full bg-[#0a0a0a] grid  place-content-center sticky top-0 rounded-tr-2xl rounded-tl-2xl">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            <HeroHighlight>
              <motion.h1
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: [20, -5, 0],
                }}
                transition={{
                  duration: 0.5,
                  ease: [0.4, 0.0, 0.2, 1],
                }}
                className="text-2xl px-4 sm:flex sm:flex-col gap-1 md:text-4xl lg:text-5xl font-bold text-white max-w-4xl leading-relaxed lg:leading-snug text-center mx-auto "
              >
                {/* <h1 className="xl:text-6xl md:text-4xl text-3xl px-8 font-semibold text-center tracking-tight leading-[120%]"> */}
                <span>Answer a few questions and let </span>
                <span>
                  <Highlight className={`text-white p-1`}>
                    AI create a trip tailored just for you
                  </Highlight>
                </span>
                {/* </h1> */}
              </motion.h1>
            </HeroHighlight>
          </section>
        </div>
        {/* Our offerings */}
        <section className="text-white w-full bg-[#0a0a0a] grid justify-aroound rounded-tr-2xl rounded-tl-2xl">
          <div className="flex w-full justify-around">
            <div className=" sticky top-0 h-screen flex items-center justify-start">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:px-8 font-semibold text-left tracking-tight leading-[120%]">
                What we offer?
                <MorphingText
                  texts={[
                    "Luxurious Hotels",
                    "Delicious Cuisines",
                    "Tailored Itinerary",
                    "Estimated Cost",
                  ]}
                />
              </h1>
            </div>
            <div className="grid gap-2">
              <figure className="grid place-content-center -skew-x-12 xs:max-w-12 ">
                <Image
                  src="https://images.unsplash.com/photo-1545073334-9cb53498f1dc?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="trip image"
                  className="transition-all duration-300 xs:scale-50 md:scale-100 xs:w-10 xs:h-20 md:w-60 md:h-80 lg:w-80 lg:h-96  align-bottom object-cover"
                  width={160}
                  height={50}
                />
              </figure>
              <figure className="grid place-content-center skew-x-12 xs:max-w-12">
                <Image
                  src="https://images.unsplash.com/photo-1603011900469-ed3539c7199c"
                  alt="trip image"
                  width={160}
                  height={30}
                  className="transition-all duration-300 xs:w-30 xs:h-40 md:w-60 md:h-80 lg:w-80 lg:h-96  align-bottom object-cover "
                />
              </figure>
              <figure className="grid place-content-center -skew-x-12">
                <Image
                  src="https://images.unsplash.com/photo-1542144612-1b3641ec3459"
                  alt="trip image"
                  width={160}
                  height={30}
                  className="transition-all duration-300 xs:w-30 xs:h-40 md:w-60 md:h-80 lg:w-80 lg:h-96  align-bottom object-cover "
                />
              </figure>
              <figure className="grid place-content-center skew-x-12">
                <Image
                  src="https://images.unsplash.com/photo-1685904042960-66242a0ac352?w=500&auto=format&fit=crop"
                  alt="trip image"
                  width={160}
                  height={30}
                  className="transition-all duration-300 xs:w-30 xs:h-40 md:w-60 md:h-80 lg:w-80 lg:h-96  align-bottom object-cover "
                />
              </figure>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="text-white w-full bg-[#0a0a0a] grid place-content-center sticky top-0 h-screen gap-32 justify-center items-center">
          <h1 className="xl:text-6xl md:text-4xl text-3xl px-8 font-semibold text-center tracking-tight leading-[120%]">
            Testimonials of Our Clients
          </h1>
          <div className="w-full max-w-3xl md:max-w-5xl xl:max-w-6xl">
            <InfiniteMovingCards
              items={testimonials}
              direction="right"
              speed="slow"
            />
          </div>
        </section>
      </main>
    </ReactLenis>
  );
};

export default StickyFeatures;

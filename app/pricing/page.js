"use client";
import React, { useEffect, useState, useRef } from "react";
import { pricingPlans } from "@/constants";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

function Pricing() {
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(null);
  const plansRef = useRef(null);

  const handlePlanSelect = (index, event) => {
    event.stopPropagation();
    setSelectedPlanIndex(index);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (plansRef.current && !plansRef.current.contains(event.target)) {
        setSelectedPlanIndex(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedPlanIndex]);
  // Todo: Implement subscription logic

  return (
    <>
      <div className="flex flex-col w-full text-white my-28">
        <div className="w-full flex flex-col gap-8">
          <h1 className="w-full text-center text-5xl font-bold">Pricing</h1>
          <p className="w-full px-4 text-center text-gray-500 md:text-xl">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolores
            aliquid sed nemo corporis eveniet sint doloremque quas,
          </p>
        </div>
        {/* Pricing blocks */}
        <div className="grid grid-cols-1 justify-center items-center lg:grid-cols-3 w-full gap-12 p-12 mt-12">
          {pricingPlans.map((plan, index) => (
            <div
              ref={plansRef}
              className={`w-full border-gray-700 border-2 hover:bg-gray-700/30 max-w-md mx-auto ${
                selectedPlanIndex === index
                  ? "scale-110 bg-gray-700/30"
                  : "scale-100 bg-inherit"
              } rounded-md px-4 xl:px-8 py-8 xl:py-16 flex flex-col gap-8 transition-transform duration-200 ease-in-out`}
              key={index}
              onClick={(e) => handlePlanSelect(index, e)}
            >
              <div className="w-full text-center flex flex-col gap-4">
                <h2 className="text-2xl font-bold">{plan.title}</h2>
                <p className="text-gray-500">{plan.subtitle}</p>
                <h1>
                  <span className="text-4xl font-extrabold">
                    {plan.price}
                    {"  "}
                  </span>
                  <span>/ month</span>
                </h1>
              </div>
              <div>
                <ul className="flex flex-col gap-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex gap-4">
                      <span>
                        <Check className="w-6 h-6 text-green-600" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full">
                <Button className="w-full">Subscribe</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Pricing;

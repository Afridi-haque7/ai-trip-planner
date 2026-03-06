"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { pricingPlans } from "@/constants";
import { Check, X, Zap, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PLAN_META = [
  {
    badge: null,
    accentFrom: "from-slate-500",
    accentTo: "to-slate-600",
    icon: <Zap className="w-6 h-6" />,
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-300",
    cta: "Get started free",
    ctaVariant: "outline",
    highlight: false,
  },
  {
    badge: "Most Popular",
    accentFrom: "from-violet-500",
    accentTo: "to-indigo-600",
    badgeBg: "bg-violet-500",
    icon: <Star className="w-6 h-6" />,
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-300",
    cta: "Start with Starter",
    ctaVariant: "default",
    highlight: true,
  },
  {
    badge: "Best Value",
    accentFrom: "from-amber-400",
    accentTo: "to-orange-500",
    badgeBg: "bg-amber-500",
    icon: <Sparkles className="w-6 h-6" />,
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-300",
    cta: "Go Pro",
    ctaVariant: "default",
    highlight: false,
  },
];

function isIncluded(feature) {
  return !feature.toLowerCase().startsWith("no ");
}

function featureLabel(feature) {
  return isIncluded(feature) ? feature : feature.replace(/^no /i, "");
}

function FAQ() {
  const faqs = [
    {
      q: "Can I switch plans at any time?",
      a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
    },
    {
      q: "What counts as a trip?",
      a: "Each time you generate a new AI-powered trip plan it counts as one trip toward your monthly quota. Viewing or re-opening saved trips does not count.",
    },
    {
      q: "Is my data safe?",
      a: "Your trip data is stored securely in MongoDB and is only accessible to you when logged in. We never sell your personal data.",
    },
    {
      q: "Do unused trips roll over?",
      a: "No. Your monthly quota resets on the 1st of every month and unused generations do not carry forward.",
    },
  ];

  const [open, setOpen] = useState(null);

  return (
    <section className="w-full max-w-2xl mx-auto mt-24 px-4">
      <h2 className="text-2xl font-bold text-center mb-8">
        Frequently Asked Questions
      </h2>
      <div className="flex flex-col divide-y divide-border border border-border rounded-2xl overflow-hidden">
        {faqs.map((faq, i) => (
          <button
            key={i}
            onClick={() => setOpen(open === i ? null : i)}
            className="text-left px-6 py-5 hover:bg-secondary/40 transition-colors w-full"
          >
            <div className="flex justify-between items-center gap-4">
              <span className="font-medium text-sm">{faq.q}</span>
              <span
                className={`text-muted-foreground transition-transform duration-200 shrink-0 ${
                  open === i ? "rotate-45" : ""
                }`}
              >
                <X className="w-4 h-4" />
              </span>
            </div>
            {open === i && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </p>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

export default function Pricing() {
  const router = useRouter();
  const handleTryBuilder = () => router.push(`/create-trip/${crypto.randomUUID()}`);
  return (
    <div className="min-h-screen w-full">
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-500/10 rounded-full blur-[120px]" />
        </div>
        <span className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-500 dark:text-violet-400 text-xs font-semibold px-3 py-1 rounded-full border border-violet-500/20 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Simple, transparent pricing
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
          Plan smarter,{" "}
          <span className="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
            travel better
          </span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Start free. Upgrade when you&apos;re ready. No hidden fees, no
          contracts.
        </p>
      </section>

      {/* Plan cards */}
      <section className="w-full max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {pricingPlans.map((plan, index) => {
            const meta = PLAN_META[index];
            return (
              <div
                key={index}
                className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 bg-card
                  ${
                    meta.highlight
                      ? "border-violet-500/50 shadow-[0_0_40px_-6px_rgba(139,92,246,0.35)] scale-[1.02]"
                      : "border-border hover:shadow-lg hover:border-border/80"
                  }`}
              >
                {/* Accent bar */}
                <div
                  className={`h-1 w-full bg-gradient-to-r ${meta.accentFrom} ${meta.accentTo}`}
                />

                {/* Badge */}
                {meta.badge && (
                  <div className="absolute top-4 right-4">
                    <span
                      className={`${meta.badgeBg} text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full`}
                    >
                      {meta.badge}
                    </span>
                  </div>
                )}

                <div className="p-8 flex flex-col flex-grow gap-6">
                  {/* Header */}
                  <div className="flex flex-col gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${meta.iconBg} ${meta.iconColor}`}
                    >
                      {meta.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{plan.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-1">
                    <span
                      className={`text-5xl font-extrabold tracking-tight bg-gradient-to-br ${meta.accentFrom} ${meta.accentTo} bg-clip-text text-transparent`}
                    >
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm mb-2">
                      &nbsp;/ month
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-3 flex-grow">
                    {plan.features.map((feature, fi) => {
                      const included = isIncluded(feature);
                      return (
                        <li key={fi} className="flex items-center gap-3">
                          <span
                            className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                              included
                                ? `bg-gradient-to-br ${meta.accentFrom} ${meta.accentTo}`
                                : "bg-muted"
                            }`}
                          >
                            {included ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <X className="w-3 h-3 text-muted-foreground" />
                            )}
                          </span>
                          <span
                            className={`text-sm ${
                              included
                                ? "text-foreground"
                                : "text-muted-foreground line-through"
                            }`}
                          >
                            {featureLabel(feature)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA */}
                  <div className="mt-auto pt-6">
                    <Button
                      asChild
                      className={`w-full font-semibold ${
                        meta.highlight
                          ? "bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white border-0"
                          : index === 2
                            ? "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-0"
                            : ""
                      }`}
                      variant={meta.ctaVariant}
                      size="lg"
                    >
                      <Link href="/login?redirect=/dashboard">{meta.cta}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust line */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" />
            No credit card for free plan
          </span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" />
            Cancel anytime
          </span>
          <span className="hidden sm:inline text-border">·</span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" />
            Quota resets every month
          </span>
        </div>
      </section>

      {/* Comparison table */}
      <section className="w-full max-w-4xl mx-auto px-4 mt-12 mb-4">
        <h2 className="text-2xl font-bold text-center mb-8">Compare plans</h2>
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground w-1/2">
                    Feature
                  </th>
                  {pricingPlans.map((plan, i) => (
                    <th
                      key={i}
                      className={`text-center px-4 py-4 font-bold ${
                        i === 1 ? "text-violet-500" : ""
                      }`}
                    >
                      {plan.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Trips per month", "2", "10", "30"],
                  ["AI trip generation", true, true, true],
                  ["Basic configuration", true, true, true],
                  ["Individual configuration", false, true, true],
                  ["Advanced configuration", false, false, true],
                  ["Premium support", false, "6 months", "1 year"],
                  ["Free updates", false, "6 months", "1 year"],
                  ["Setup / hidden fees", false, false, false],
                ].map(([label, ...vals], ri) => (
                  <tr
                    key={ri}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-6 py-4 text-foreground font-medium">
                      {label}
                    </td>
                    {vals.map((val, vi) => (
                      <td key={vi} className="text-center px-4 py-4">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span
                            className={`font-semibold ${
                              vi === 1 ? "text-violet-500" : "text-foreground"
                            }`}
                          >
                            {val}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* Bottom CTA banner */}
      <section className="w-full max-w-2xl mx-auto text-center px-4 mt-24 mb-24">
        <div className="rounded-2xl border border-border bg-card p-10 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-violet-500/10 rounded-full blur-[80px]" />
          </div>
          <h2 className="text-3xl font-extrabold mb-3">
            Ready to start planning?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of travellers who use TripTailor to craft perfect
            itineraries in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white border-0 font-semibold"
            >
              <Link href="/login?redirect=/dashboard">
                Get started for free
              </Link>
            </Button>
            <Button size="lg" variant="outline" onClick={handleTryBuilder}>
              Try trip builder
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

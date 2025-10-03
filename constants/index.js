import {
  IconBrandGithub,
  IconBrandX,
  IconExchange,
  IconHome,
  IconNewSection,
  IconTerminal2,
  IconBrandInstagram,
} from "@tabler/icons-react";
import { House, LayoutDashboard, DollarSign, Instagram } from "lucide-react";
// import { redirectIfUnauthenticated } from "@/app/helper";
export const BudgetOptions = [
  {
    index: 1,
    title: "Pocket Friendly",
    description: "0-1000 USD",
    value: "cheap",
    icon: "https://img.icons8.com/?size=100&id=SQUhc67Yi70U&format=png&color=000000",
  },
  {
    index: 2,
    title: "Premium",
    description: "1000-5000 USD",
    value: "medium",
    icon: "https://img.icons8.com/?size=100&id=3Qj1WJsYS8T4&format=png&color=000000",
  },
  {
    index: 3,
    title: "Luxury",
    description: "10000 USD+",
    value: "expensive",
    icon: "https://img.icons8.com/?size=100&id=h3USDbkfsNWM&format=png&color=000000",
  },
];

export const MemberOptions = [
  {
    index: 1,
    title: "Just Me",
    description: "Explore the joy of Solo travelling",
    people: "1 person",
    value: 1,
    icon: "https://img.icons8.com/?size=100&id=D8VKrTR2XbbX&format=png&color=000000",
  },
  {
    index: 2,
    title: "Couples",
    description: "Travel around the world with your partner",
    people: "2 people",
    value: 2,
    icon: "https://img.icons8.com/?size=100&id=4gjfpXeaY5Hv&format=png&color=000000",
  },
  {
    index: 3,
    title: "Family",
    description: "Enjoy the world with the closest people",
    people: "3 to 6 people",
    value: 4,
    icon: "https://img.icons8.com/?size=100&id=eco2vZUxsc9M&format=png&color=000000",
  },
  {
    index: 4,
    title: "Friends",
    description: "Explore the world with adventureus people",
    people: " More than 7 people",
    value: 7,
    icon: "https://img.icons8.com/?size=100&id=Ut1mhCuyFDJQ&format=png&color=000000",
  },
];

export const testimonials = [
  {
    name: "Priya S.",
    description:
      "Planning my Goa trip was so easy with this site. It suggested the best hotels, local food spots, and even gave me a cost estimate. I didn’t have to spend hours researching!",
    image:
      "https://images.unsplash.com/photo-1610276198568-eb6d0ff53e48?q=80&w=200&auto=format",
  },
  {
    name: "Rahul K.",
    description:
      "I loved how personalized the itinerary was. The site understood my budget and recommended just the right mix of sightseeing and relaxation.",
    image:
      "https://images.unsplash.com/photo-1729157661483-ed21901ed892?q=80&w=200&auto=format&fit=crop",
  },
  {
    name: "Anita R.",
    description:
      "Instead of browsing countless blogs, I got a complete trip plan in minutes. From cuisines to must-visit places, everything was neatly organized.",
    image:
      "https://images.unsplash.com/photo-1614204424926-196a80bf0be8?q=80&w=200&auto=format&fit=crop",
  },
  {
    name: "Aditya M.",
    description:
      "This platform saved me so much time. It suggested hidden gems in Kerala along with authentic local dishes I would have otherwise missed.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
  },
  {
    name: "Neha & Arjun",
    description:
      "Our honeymoon plan came out perfect! The site mapped out daily activities, hotel options, and even dining spots, all within our budget.",
    image:
      "https://images.unsplash.com/photo-1720105761832-927de5f2ecce?q=80&w=200&auto=format&fit=crop",
  },
];
export const links = [
  {
    title: "Home",
    icon: <House className="h-full w-full text-neutral-300" />,
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
    icon: <LayoutDashboard className="w-full h-full" />,
    href: "/dashboard",
  },
  {
    title: "Pricing",
    icon: (
      <DollarSign className="h-full w-full text-neutral-500 dark:text-neutral-300" />
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
      <IconBrandInstagram className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    ),
    href: "/",
  },
];
export const images = [
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
export const pricingPlans = [
  {
    title: "Free",
    subtitle: "Good for trying out the platform and basic usage.",
    price: "$0",
    features: [
      "Basic configuration",
      "No setup, or hidden fees",
      "2 trips per month",
      "No premium support",
      "No free updates",
    ],
  },
  {
    title: "Starter",
    subtitle: "Best option for personal use and try the platform.",
    price: "$11",
    features: [
      "Individual configuration",
      "No setup, or hidden fees",
      "10 trips per month",
      "Premium support: 6 months",
      "Free updates: 6 months",
    ],
  },
  {
    title: "Pro",
    subtitle: "Perfect for teams and organizations.",
    price: "$29",
    features: [
      "Advanced configuration",
      "No setup, or hidden fees",
      "30 trips per month",
      "Premium support: 1 year",
      "Free updates: 1 year",
    ],
  },
];

"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Mail, Clock, Headphones, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Globe = dynamic(() => import("@/components/magicui/globe.jsx"), {
  ssr: false,
});
const MagicCard = dynamic(
  () => import("@/components/magicui/magic-card.jsx"),
  { ssr: false }
);

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address.";
    if (!form.message.trim()) errs.message = "Message is required.";
    else if (form.message.length > 2000)
      errs.message = "Message must be under 2000 characters.";
    return errs;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Message sent! We'll get back to you soon.");
        setForm({ name: "", email: "", message: "" });
        setErrors({});
      } else {
        toast.error(data.error || "Something went wrong.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full">
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-500/10 rounded-full blur-[120px]" />
        </div>
        <span className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-500 dark:text-violet-400 text-xs font-semibold px-3 py-1 rounded-full border border-violet-500/20 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          We&apos;d love to hear from you
        </span>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
          Get in{" "}
          <span className="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
            Touch
          </span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Have a question, feedback, or just want to say hello? Fill in the form
          and we&apos;ll get back to you.
        </p>
      </section>

      {/* Main content */}
      <section className="w-full max-w-6xl mx-auto px-4 pb-24">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          {/* Form */}
          <div className="flex-1">
            <Card className="w-full shadow-none border-none text-foreground p-0">
              <MagicCard gradientColor={"#262626"} className="p-8 border-none">
                <CardHeader className="p-4">
                  <CardTitle className="flex flex-col gap-1 items-center">
                    <span className="text-3xl font-bold">Contact Us</span>
                    <p className="text-sm text-muted-foreground font-normal mt-1">
                      We typically respond within 24 hours.
                    </p>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleSubmit} noValidate>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your name"
                          value={form.name}
                          onChange={handleChange}
                          className={`border-border ${errors.name ? "border-destructive" : ""}`}
                          disabled={loading}
                        />
                        {errors.name && (
                          <p className="text-xs text-destructive">
                            {errors.name}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Your Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={form.email}
                          onChange={handleChange}
                          className={`border-border ${errors.email ? "border-destructive" : ""}`}
                          disabled={loading}
                        />
                        {errors.email && (
                          <p className="text-xs text-destructive">
                            {errors.email}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="message">Your Message</Label>
                        <Textarea
                          id="message"
                          placeholder="How can we help you?"
                          value={form.message}
                          onChange={handleChange}
                          rows={5}
                          className={`border-border resize-none ${errors.message ? "border-destructive" : ""}`}
                          disabled={loading}
                        />
                        <div className="flex justify-between items-center">
                          {errors.message ? (
                            <p className="text-xs text-destructive">
                              {errors.message}
                            </p>
                          ) : (
                            <span />
                          )}
                          <p className="text-xs text-muted-foreground">
                            {form.message.length}/2000
                          </p>
                        </div>
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="p-4">
                  <Button
                    className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white border-0"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </CardFooter>
              </MagicCard>
            </Card>
          </div>

          {/* Right panel — Globe only */}
          <div className="flex-1 flex items-center justify-center">
            <Globe className="scale-90" />
          </div>
        </div>

        {/* Info cards — full-width 3-column row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <p className="font-semibold text-sm">Email Us</p>
              <p className="text-sm text-muted-foreground">
                Use the form to send us a message directly.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <p className="font-semibold text-sm">Response Time</p>
              <p className="text-sm text-muted-foreground">
                We aim to respond within 24 hours on business days.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <p className="font-semibold text-sm">Support Hours</p>
              <p className="text-sm text-muted-foreground">
                Monday – Friday, 9 AM – 6 PM (UTC).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

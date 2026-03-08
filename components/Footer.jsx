"use client";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import { toast } from "sonner";
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

const Globe = dynamic(() => import("@/components/magicui/globe.jsx"));
const MagicCard = dynamic(() => import("@/components/magicui/magic-card.jsx"));

function Footer() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all fields.");
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
    <>
      <p className="text-foreground xl:text-6xl md:text-5xl sm:text-4xl text-3xl font-semibold text-center mb-12 flex flex-col lg:flex-row justify-center">
        <span>Have Questions?</span>{" "}
        <span className="text-primary"> Let Us Know</span>{" "}
      </p>
      <div className="flex w-full md:flex-row flex-col items-center justify-around gap-4">
        <div className="flex w-full basis-12 md:basis-1/2 justify-center p-4">
          <Card className="max-w-md w-full shadow-none border-none text-foreground p-0">
            <MagicCard gradientColor={"#262626"} className="p-8 border-none">
              <CardHeader className=" p-4 ">
                <CardTitle className="flex flex-col gap-1 items-center ">
                  <span className="text-4xl ">Contact Us</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleSubmit} noValidate>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Your Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={handleChange}
                        className={`border-border`}
                        disabled={loading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        value={form.name}
                        onChange={handleChange}
                        className={`border-border`}
                        disabled={loading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="message">Your Message</Label>
                      <Textarea
                        id="message"
                        className={`border-border resize-none`}
                        placeholder="Enter your message"
                        value={form.message}
                        onChange={handleChange}
                        rows={4}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="p-4 ">
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </CardFooter>
            </MagicCard>
          </Card>
        </div>
        <div className="relative flex basis-1/2">
          <Globe className={`scale-100`} />
        </div>
      </div>
      <div className="flex items-center justify-center p-4 mt-12">
        <div>
          <p className="text-muted-foreground text-sm">
            © 2025 Trip Tailor. All Rights Reserved.
          </p>
        </div>
        {/* <div className="flex basis-1/2 justify-center" >
          <p className="text-muted-foreground text-sm">Follow us on: </p>
        </div> */}
      </div>
    </>
  );
}

export default Footer;

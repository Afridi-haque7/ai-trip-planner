"use client";
import dynamic from "next/dynamic";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { Textarea } from "@/components/ui/textarea";

const Globe = dynamic(() => import("@/components/magicui/globe.jsx"));
const MagicCard = dynamic(() => import("@/components/magicui/magic-card.jsx"));

function Footer() {
  return (
    <>
      <p className="text-white xl:text-6xl md:text-5xl sm:text-4xl text-3xl font-semibold text-center mb-12 flex flex-col lg:flex-row justify-center">
        <span>Have Questions?</span>{" "}
        <span className="text-blue-600"> Let Us Know</span>{" "}
      </p>
      <div className="flex w-full md:flex-row flex-col items-center justify-around gap-4">
        <div className="flex w-full basis-12 md:basis-1/2 justify-center p-4">
          <Card className="max-w-md w-full shadow-none border-none text-white p-0">
            <MagicCard gradientColor={"#262626"} className="p-8 border-none">
              <CardHeader className=" p-4 ">
                <CardTitle className="flex flex-col gap-1 items-center ">
                  <span className="text-4xl ">Contact Us</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Your Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        className={`border-gray-100/10`}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        className={`border-gray-100/10`}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="message">Your Message</Label>
                      <Textarea
                        className={`border-gray-100/10`}
                        placeholder="Enter your message"
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="p-4 ">
                <Button className="w-full">Send Meesage</Button>
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
          <p className="text-gray-400 text-sm">
            © 2025 Trip Tailor. All Rights Reserved.
          </p>
        </div>
        {/* <div className="flex basis-1/2 justify-center" >
          <p className="text-gray-400 text-sm">Follow us on: </p>
        </div> */}
      </div>
    </>
  );
}

export default Footer;

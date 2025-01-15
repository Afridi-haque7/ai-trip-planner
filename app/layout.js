import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Trip Tailor",
  description: "AI trip planner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="relative min-h-screen">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}

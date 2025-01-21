import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import AuthProvider from "@/context/AuthProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Trip Tailor",
  description: "AI trip planner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <AuthProvider>
        <body className={inter.className}>
          <div className="relative min-h-screen">
            <Navbar />
            <main>{children}</main>
            <Toaster closeButton />
          </div>
        </body>
      </AuthProvider>
    </html>
  );
}

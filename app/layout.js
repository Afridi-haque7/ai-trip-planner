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
        <body className={inter.className} style={{ margin: 0, padding: 0, width: "100%", background: "#0a0a0a" }}>
          <div className="relative min-h-screen w-full bg-[#0a0a0a] m-0 p-0">
            <Navbar />
            <main>{children}</main>
            <Toaster closeButton />
          </div>
        </body>
      </AuthProvider>
    </html>
  );
}

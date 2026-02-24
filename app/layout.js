import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import AuthProvider from "@/context/AuthProvider";
import { ReduxProvider } from "@/lib/redux/ReduxProvider";
import { FloatingDock } from "@/components/ui/floating-dock";
import { links } from "@/constants";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Trip Tailor",
  description: "AI trip planner",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <ReduxProvider>
        <AuthProvider>
        <body
          className={inter.className}
          style={{
            margin: 0,
            padding: 0,
            width: "100%",
          }}
        >
          <div className="relative min-h-screen w-full bg-background m-0 p-0">
            <Navbar />
            <div className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2">
              <FloatingDock
                items={links}
                desktopClassName={`bg-transparent backdrop-blur-sm`}
                mobileClassName={`backdrop-blur-sm`}
              />
            </div>
            <main>{children}</main>
            <Toaster closeButton />
          </div>
        </body>
      </AuthProvider>
      </ReduxProvider>
    </html>
  );
}

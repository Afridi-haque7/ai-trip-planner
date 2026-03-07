'use client';

import { ThemeProvider } from "@/components/theme-provider";

export default function AuthProvider({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  );
}
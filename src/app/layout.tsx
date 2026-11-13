import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Shell } from "@/components/shell/Shell";

export const metadata: Metadata = {
  title: "Prep Studio",
  description: "Placement preparation for data, ML and product roles: SQL, Python, ML concepts, cases and timed assessments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `dark` is the server default; ThemeSync swaps the class after hydration if the user chose light.
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

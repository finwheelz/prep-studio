import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Shell } from "@/components/shell/Shell";

export const metadata: Metadata = {
  title: "Prep Studio",
  description: "Placement preparation for data, ML and product roles: SQL, Python, ML concepts, cases and timed assessments.",
  openGraph: {
    title: "Prep Studio",
    description: "Practise SQL, Python, ML concepts, product cases and timed OAs in the browser. No sign-up; progress stays on your device.",
    type: "website",
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

// Runs before first paint so a saved light theme never flashes dark. Mirrors the zustand persist key in lib/store.ts.
const THEME_BOOT = `try{var t=JSON.parse(localStorage.getItem("prep-studio/v1")||"{}").state;if(t&&t.theme==="light")document.documentElement.classList.remove("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `dark` is the server default; ThemeSync swaps the class after hydration if the user chose light.
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

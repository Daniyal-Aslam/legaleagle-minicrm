import type { Metadata, Viewport } from "next";
import { Outfit, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Legal Eagle CRM",
    template: "%s · Legal Eagle CRM",
  },
  description:
    "CRM demo for Legal Eagle UAE. Manage enquiries, notes and the client pipeline. Demonstration environment with fictional data.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#011c1a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${poppins.variable}`}>
      <body>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster position="bottom-right" closeButton />
      </body>
    </html>
  );
}

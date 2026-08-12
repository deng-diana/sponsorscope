import type { Metadata } from "next";
import { Charis_SIL, Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const charis = Charis_SIL({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-charis",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
export const metadata: Metadata = {
  title: "SponsorScope",
  description:
    "Search the UK register of licensed visa sponsors and find out whether a company can sponsor a Skilled Worker visa.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", charis.variable, inter.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

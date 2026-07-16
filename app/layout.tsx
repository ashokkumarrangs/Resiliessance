import { DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Shell from "@/components/shell";
import { ThemeSwitcher } from "@/components/theme-switcher";

const dmSans = DM_Sans({ 
  subsets: ["latin", "latin-ext"], 
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600", "700", "800", "900"]
});

export const metadata = {
  title: "Resiliessance",
  description: "Personal Operating System by Heyyy",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("antialiased", dmSans.variable)}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-background sm:shadow-2xl sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl sm:mx-auto min-h-screen">
        <Shell>{children}</Shell>
        <ThemeSwitcher />
        <Toaster position="top-center" richColors />
      </body>

    </html>
  );
}


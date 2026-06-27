import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { ToastProvider } from "@/components/ui/Toaster";
import SplashIntro from "@/components/ui/SplashIntro";
import OfflineBanner from "@/components/ui/OfflineBanner";

export const metadata: Metadata = {
  metadataBase: new URL("https://thenijobs.com"),
  title: {
    default: "THENIJOBS - Search, Connect, Hire and Grow",
    template: "%s | THENIJOBS",
  },
  description:
    "THENIJOBS helps people find jobs, discover businesses, generate B2B leads and hire talent across Theni district.",
  keywords: [
    "Theni jobs",
    "jobs in theni",
    "business directory theni",
    "job portal theni",
    "hire candidates theni",
    "thenijobs",
    "local business listing",
    "recruitment theni",
    "author theni",
  ],
  authors: [{ name: "THENIJOBS" }],
  creator: "THENIJOBS",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://thenijobs.com",
    siteName: "THENIJOBS",
    title: "THENIJOBS - Search, Connect, Hire and Grow",
    description: "Find jobs, businesses, leads and services across Theni district",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "THENIJOBS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "THENIJOBS - Search, Connect, Hire and Grow",
    description: "Find jobs, businesses, leads and services across Theni district",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a1a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans antialiased bg-[#0a0a1a] text-white">
        <ToastProvider>
          <PreferencesProvider>
            <AuthProvider>
              <NotificationProvider>
                <OfflineBanner />
                <SplashIntro />
                {children}
              </NotificationProvider>
            </AuthProvider>
          </PreferencesProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

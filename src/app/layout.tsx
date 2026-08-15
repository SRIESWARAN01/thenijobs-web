import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { GlobalErrorTracker } from "@/lib/firebase/errorTracker";

export const metadata: Metadata = {
  metadataBase: new URL("https://thenijobs.com"),
  title: {
    default: "THENIJOBS – Jobs in Theni, Tamil Nadu | Local Job Portal",
    template: "%s | THENIJOBS",
  },
  description:
    "THENIJOBS is the #1 local job portal for Theni and Tamil Nadu. Find verified private, fresher, and full-time jobs across Theni, Cumbum, Periyakulam, Bodinayakanur and nearby areas. Apply directly online.",
  keywords: [
    "Theni jobs", "jobs in theni", "theni job vacancy", "theni jobs for freshers",
    "private jobs in theni", "job portal tamil nadu", "hire candidates theni", "thenijobs",
    "jobs in cumbum", "jobs in periyakulam", "jobs in bodinayakanur",
  ],
  authors: [{ name: "THENIJOBS" }],
  creator: "THENIJOBS",
  openGraph: {
    type: "website", locale: "en_IN", url: "https://thenijobs.com",
    siteName: "THENIJOBS",
    title: "THENIJOBS - Search, Connect, Hire and Grow",
    description: "Find jobs, businesses, leads and services in Theni and Tamil Nadu",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "THENIJOBS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "THENIJOBS - Search, Connect, Hire and Grow",
    description: "Find jobs, businesses, leads and services in Theni and Tamil Nadu",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/logo.png",
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563EB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        {/* Google Fonts preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/logo.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="font-sans antialiased bg-[#F8FAFC] text-[#111827]">
        <GlobalErrorTracker />
        <ErrorBoundary>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}


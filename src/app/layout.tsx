import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { GlobalErrorTracker } from "@/lib/firebase/errorTracker";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["600", "700", "800"],
});

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
      { url: "/logo-sm.webp", type: "image/webp", sizes: "96x96" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/logo-sm.webp",
    apple: [
      { url: "/logo-sm.webp", sizes: "180x180", type: "image/webp" },
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
    <html lang="en-IN" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo-sm.webp" type="image/webp" sizes="any" />
        <link rel="apple-touch-icon" href="/logo-sm.webp" />
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


import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export const metadata: Metadata = {
  metadataBase: new URL("https://thenijobs.com"),
  title: {
    default: "THENIJOBS - Search, Connect, Hire and Grow",
    template: "%s | THENIJOBS",
  },
  description:
    "THENIJOBS helps people find jobs, discover businesses, generate B2B leads and hire talent in Theni and across Tamil Nadu.",
  keywords: [
    "Theni jobs", "jobs in theni", "business directory theni",
    "job portal tamil nadu", "hire candidates theni", "thenijobs",
    "local business listing", "recruitment theni", "author theni",
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
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
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
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="font-sans antialiased bg-[#F8FAFC] text-[#111827]">
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


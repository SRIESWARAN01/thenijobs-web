import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/components/ui/Toaster";
import SplashIntro from "@/components/ui/SplashIntro";
import OfflineBanner from "@/components/ui/OfflineBanner";
import MobileAuthGate from "@/components/auth/MobileAuthGate";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thenijobs.com"),
  title: {
    default: "THENIJOBS - Search, Connect, Hire and Grow",
    template: "%s | THENIJOBS",
  },
  description:
    "THENIJOBS helps people find jobs, discover businesses, generate B2B leads and hire talent across Theni district.",
  keywords: [
    // Primary Brand Keywords
    'Theni Jobs',
    'THENIJOBS',
    'TheniJobs',
    'Theni Jobs Official',
    'Theni Jobs Portal',

    // Main Job Search Keywords
    'Jobs in Theni',
    'Theni Job Vacancy',
    'Latest Jobs in Theni',
    'Today Jobs in Theni',
    'Private Jobs in Theni',
    'Government Jobs in Theni',
    'Theni District Jobs',
    'Job Openings in Theni',
    'Urgent Jobs in Theni',
    'Walk in Interview Theni',

    // Hiring Keywords
    'Hire Employees in Theni',
    'Recruitment in Theni',
    'Staff Hiring Theni',
    'Employers in Theni',
    'Post Job in Theni',
    'Find Candidates in Theni',

    // Local City Keywords
    'Bodinayakanur Jobs',
    'Periyakulam Jobs',
    'Cumbum Jobs',
    'Uthamapalayam Jobs',
    'Andipatti Jobs',
    'Chinnamanur Jobs',
    'Kambam Jobs',
    'Vaigai Dam Jobs',

    // Nearby District Keywords
    'Madurai Jobs',
    'Dindigul Jobs',
    'Virudhunagar Jobs',
    'Tamil Nadu Jobs',
    'South Tamil Nadu Jobs',

    // Job Categories
    'Part Time Jobs Theni',
    'Full Time Jobs Theni',
    'Work From Home Theni',
    'Fresher Jobs Theni',
    'Experienced Jobs Theni',
    'IT Jobs Theni',
    'Sales Jobs Theni',
    'Office Jobs Theni',
    'Driver Jobs Theni',
    'Delivery Jobs Theni',
    'Teaching Jobs Theni',
    'Hospital Jobs Theni',
    'Hotel Jobs Theni',
    'Factory Jobs Theni',
    'Electrician Jobs Theni',
    'Accountant Jobs Theni',
    'Marketing Jobs Theni',
    'Security Jobs Theni',

    // Business Directory
    'Theni Business Directory',
    'Businesses in Theni',
    'Local Business Theni',
    'Business Listing Theni',
    'Service Providers Theni',
    'Verified Businesses Theni',
    'Companies in Theni',
    'Shops in Theni',

    // SEO Long Tail
    'Best Job Portal in Theni',
    'Best Jobs Website in Theni',
    'Local Jobs Near Me',
    'Jobs Near Me',
    'Job Search Theni',
    'Employment Opportunities Theni',
    'Find Jobs in Tamil Nadu',
    'Tamil Nadu Employment',
    'Latest Recruitment Tamil Nadu',
    'Daily Job Updates Theni',
    'Free Job Posting Theni',
    'Apply Jobs Online Theni',
    'Theni Career Portal',
    'Tamil Nadu Career Opportunities',
    'Trusted Job Portal Tamil Nadu',
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
    creator: "@thenijobs",
  },
  // NOTE: Do NOT set alternates.canonical here — it cascades to ALL child pages
  // and tells Google they're duplicates of the homepage. Each indexable page
  // must define its own canonical in its own metadata export.
  
  category: "Jobs & Recruitment",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" as const, "max-snippet": -1, "max-video-preview": -1 },
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
  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "THENIJOBS",
    url: "https://thenijobs.com",
    logo: "https://thenijobs.com/icon-512.png",
    sameAs: [],
    description:
      "THENIJOBS helps people find jobs, discover businesses, generate B2B leads and hire talent across Theni district, Tamil Nadu.",
    address: {
      "@type": "PostalAddress",
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    },
  };

  const jsonLdWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "THENIJOBS",
    url: "https://thenijobs.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://thenijobs.com/jobs?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en-IN" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        {/* DNS prefetch & preconnect for critical third-party origins */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
      </head>
      <body className="font-sans antialiased bg-[#0a0a1a] text-white">
        {/* Skip to content — WCAG 2.1 Level A accessibility requirement */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-violet-600 focus:text-white focus:text-sm focus:font-bold focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <ToastProvider>
          <PreferencesProvider>
            <ThemeProvider>
              <AuthProvider>
                <NotificationProvider>
                  <OfflineBanner />
                  <PWAInstallPrompt />
                  <SplashIntro />
                  <MobileAuthGate>
                    {children}
                  </MobileAuthGate>
                </NotificationProvider>
              </AuthProvider>
            </ThemeProvider>
          </PreferencesProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

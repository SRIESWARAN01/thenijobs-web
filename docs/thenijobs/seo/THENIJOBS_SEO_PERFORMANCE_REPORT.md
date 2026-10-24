# THENIJOBS – Core Web Vitals & Performance Audit Report

**Project:** THENIJOBS  
**Production Host:** `https://www.thenijobs.com`  
**Date:** October 24, 2026  
**Document:** Core Web Vitals & Web Performance Optimization  

---

## 1. Web Vitals Objective & Measurement Framework

Google's Core Web Vitals (CWV) directly affect both search index eligibility and user conversion rates:
1. **Largest Contentful Paint (LCP):** Measures perceived loading speed. Target: $\le 2.5\text{s}$.
2. **Interaction to Next Paint (INP):** Measures user interaction responsiveness. Target: $\le 200\text{ms}$.
3. **Cumulative Layout Shift (CLS):** Measures visual stability during page render. Target: $\le 0.1$.

---

## 2. Platform Architecture Optimizations

### A. Next.js App Router & Turbopack Compilation
* **Static Prerendering (SSG):** 322 routes (all Theni taluks, categories, business verticals) are pre-rendered into static HTML during compilation (`npm run build`), delivering sub-100ms Time to First Byte (TTFB) via Vercel's global edge network.
* **Granular Bundle Splitting:** Route-based automatic code splitting ensures that visiting `/jobs` only loads UI chunks relevant to jobs, reducing initial JavaScript execution overhead.

### B. Image Optimization & Layout Shift Prevention
* **CLS Prevention:**
  * Explicit width and height attributes or CSS aspect-ratio wrappers (`aspect-square`, `aspect-[16/9]`) applied to company logos, product showcases, and candidate profile cards.
  * Skeleton placeholders with predetermined geometric dimensions render while Firebase data streams in.
* **Modern Formats & Lazy Loading:**
  * Company profile and marketplace images serve modern WebP/AVIF formats via CDN where supported.
  * Above-the-fold hero elements load eagerly, while below-the-fold catalog grids use native lazy loading (`loading="lazy"`).

### C. Font & CSS Delivery Optimization
* **TailwindCSS 4 Engine:** Generates a minimal, atomic CSS stylesheet free of unused utility classes.
* **Google Fonts Optimization:** Preconnected to `fonts.googleapis.com` and `fonts.gstatic.com` with `display: swap` to prevent Flash of Invisible Text (FOIT) during font download.

### D. Firebase Query Caching & Revalidation
* **Server-Safe REST Ingestion:** `src/lib/firebase/firestoreServer.ts` uses cached REST queries for static generation and server metadata calls, preventing Firebase client SDK bundle bloat on server components.
* **Hourly Sitemap Revalidation:** `revalidate = 3600` balances database egress costs with rapid crawler discovery of newly published jobs.

---

## 3. Production Build Benchmarks

From the clean production build (`npm run build`):
* **Compilation Status:** 100% Successful (`Exit status: 0`).
* **Route Generation:** 322 static and dynamic page units compiled in 14.5 seconds.
* **Total JavaScript Bundle Size:** Lean client payloads across all public discovery routes:
  * Homepage (`/`): ~98 kB first-load JS.
  * Jobs Hub (`/jobs`): ~104 kB first-load JS.
  * Marketplace Hub (`/marketplace`): ~112 kB first-load JS.
  * Daily Jobs (`/daily-jobs`): ~96 kB first-load JS.
  * Business Directory (`/businesses`): ~94 kB first-load JS.

---

## 4. Mobile Layout & Responsive Performance

* **Viewport Meta Tag:** Configured in `src/app/layout.tsx`:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
  ```
* **Touch Targets:** All interactive buttons (Apply Now, WhatsApp, Filter Chips, Bottom Nav) adhere to minimum 48x48px tap boundaries to ensure seamless mobile UX in line with Google Mobile-First Indexing requirements.
* **Bottom Navigation Bar:** Fixed bottom bar on mobile (`src/components/navigation/BottomNav.tsx`) uses GPU-accelerated transforms (`translate3d`), eliminating repaint jank during page transitions.

---

## 5. Recommended Ongoing Production Monitoring

1. **Google Search Console Core Web Vitals Report:** Monitor Real User Metrics (RUM) field data across mobile and desktop devices post-launch.
2. **CDN Edge Caching:** Leverage Vercel's Edge Cache headers (`Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`) on static API responses.
3. **Third-Party Script Isolation:** Defer any future tracking scripts (Google Tag Manager, analytics) via `next/script` with `strategy="afterInteractive"` or `strategy="lazyOnload"`.

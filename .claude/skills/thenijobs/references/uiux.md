# `uiux` lane — the existing light design system, template contracts, and SEO schema

**Scope (OWNER_DECISION D-UIUX 2026-09-04, applied default):** enforce the **existing** light
design system and the portfolio template contracts; no new components without a stop-and-report;
SEO validation (`seoValidator.ts`, `jobSchema.ts`) belongs to this lane. Marketing copy and brand
changes are a product decision — report, do not redesign.

## 1. Hard rules

- **ZERO_NEW_COMPONENTS is a stop condition.** Compose from `src/components/ui/` (19 files) and the
  existing feature components. A missing primitive = stop and report with the raw-element grep
  that proves it is missing. Prove with `git grep`, not prose.
- **Light theme only.** The live system is `#F8FAFC` background / `#111827` text with `--vk-*`
  tokens. `full.mf`'s dark theme (`#0a0a1a`, glassmorphism) is **stale**; the handoff skill's
  "deep-teal/saffron" note (commit `8920a4c`) is **superseded** by the current `globals.css`
  (primary `#2563EB`, secondary `#10B981`, accent `#F59E0B`). `next-themes` is installed and unused;
  do not wire it.
- **Tokens, not values**, where a token exists: `--vk-*` (56), role pillars `--seeker-*` /
  `--employer-*` / `--admin-*` (5 each), `--font-inter` / `--font-poppins`, `--text-*` clamp scale.
  Tailwind v4 utilities are the norm in the tree; a hardcoded hex that duplicates a token is a finding.
- **Mobile-first from 320 CSS px**; 44 px tap targets on coarse pointers; `safe-area-inset`
  padding; `html { overflow-x: hidden }` only (adding it to `body` breaks `position: sticky`
  site-wide — fixed in `5b61111`, do not regress).
- **Bilingual labels** stay paired (`feedback.md` §2).
- Single agent. No design "explorations" that fan out.

## 2. The canonical inventory (measured 2026-09-04 at `5b61111`; re-verify paths)

```
Tokens        src/app/globals.css (1458 lines, 87 custom properties; "VAANIKAN DESIGN SYSTEM" block ~L180–300)
Fonts         Inter (body 400–800) + Poppins (headings 600–800) via next/font in src/app/layout.tsx
Primitives    src/components/ui/{BrandIcons,Breadcrumb,Chart,DataTable,DeviceLivePreviewModal,EmptyState,ErrorBoundary,FeatureGate,
              FileUpload,FloatingWhatsApp,InterviewConfirmedModal,JobApplySuccessModal,LoadingSkeleton,Modal,SearchInput,Sidebar,
              StatsCard,StatusBadge,VerifiedBadge}.tsx
Navigation    src/components/navigation (Header, BottomNav) · portal layouts src/app/{seeker,employer,admin}/layout.tsx (sidebar + top bar)
Home          src/components/home (20 sections incl. HeroSection, SearchHub, TrendingJobs, FeaturedBusinesses)
Portfolio     src/lib/types/portfolio.ts: PlanTier(4) · SectionType(31) · PortfolioTheme · DEFAULT_THEME (primary #2563EB, Inter/Poppins)
              src/lib/constants.ts: PORTFOLIO_TEMPLATES (15: 3 free · 3 standard · 5 premium · 4 enterprise) · PORTFOLIO_SECTION_DEFS (26, each
              with tamilLabel + requiredPlan) · TEMPLATE_PLAN_ACCESS
              src/components/portfolio/templates/*.tsx (15 company templates + SeekerPortfolioRenderer) · TemplateRenderer.tsx · SeekerSiteEditor.tsx
SEO           src/lib/seo/{seoValidator,jobSchema,expiredJobUtils,locationPageFactory,indexingApi}.ts · src/components/seo (3) · src/app/{sitemap,robots}.ts
              metadataBase https://thenijobs.com; OG image /og-image.jpg; manifest public/manifest.json (theme #2563EB)
Icons         lucide-react (no wrapper); brand marks in BrandIcons.tsx; logo assets public/logo*.{png,webp}
```

Consumption facts (importer counts by `grep -rlF "components/ui/<Name>"`, excluding the file
itself): only 7 of the 19 primitives are imported anywhere — `VerifiedBadge` 4 ·
`FloatingWhatsApp` 4 · `BrandIcons` 4 · `DeviceLivePreviewModal` 2 · `ErrorBoundary` 1 ·
`InterviewConfirmedModal` 1 · `JobApplySuccessModal` 1. **Twelve have zero importers**
(`EmptyState`, `LoadingSkeleton`, `Modal`, `StatusBadge`, `FeatureGate`, `StatsCard`, `DataTable`,
`SearchInput`, `Sidebar`, `Breadcrumb`, `FileUpload`, `Chart`): pages hand-roll these patterns
inline. Rule: when a phase touches a screen that hand-rolls one of the twelve, it adopts the
existing primitive rather than adding a thirteenth variant — and never creates a new one. The three
portal layouts each hand-roll their sidebar (not `Sidebar.tsx`) — a decided inconsistency, not a
phase's job to unify without a decision. `globals.css` forces readable form controls with
`!important` (L330–400) because portal pages still carry dark-theme Tailwind classes — a screen
that fights that override is a finding, not a reason to weaken it.

## 3. Template and section contracts

- A template's `sections` list may only use `SectionType` values; a new `SectionType` needs: the
  union in `portfolio.ts`, a `PORTFOLIO_SECTION_DEFS` entry with `tamilLabel` and `requiredPlan`,
  renderer support in every template that lists it, and the editor's section palette. Partial =
  `BLOCKING`.
- `TEMPLATE_PLAN_ACCESS` must stay consistent with each template's `plan` field (`enterprise` =
  all 15). `canAccessTemplate()` / `getPortfolioSectionsForPlan()` (`src/lib/plans.ts`) are UI
  gates; the write-side gate is `security.md` I5 (not enforced today) — say so in any template phase.
- Seeker portfolios (`SeekerPortfolioRenderer.tsx`, `SeekerSiteEditor.tsx`) share `SectionType`
  but use the `Seeker*` data shapes; do not mix company and seeker section data.
- Theme changes go through `PortfolioTheme` fields (`buttonStyle`, `borderRadius`, `animation`,
  fonts from `FONT_OPTIONS`), never through per-template hardcoding.

## 4. SEO schema completeness (part of this lane)

- Job pages: `generateJobPostingSchema()` needs `title`, `description` (≥ 50 chars for Google),
  `companyName`, `location`/`district`, `postedDate`, and honest `baseSalary` only when real; a
  publish path that skips `validateJobForPublishing()` is a finding (`SEO_PUBLISH_VALIDATION`).
- Every public route: `metadata`/`generateMetadata` with canonical, OG and Twitter cards
  (pattern: `src/app/layout.tsx`, `src/app/jobs/[id]`); every new public route is added to
  `sitemap.ts`; every private route to `robots.ts` `disallow`.
- Static export: dynamic routes need `generateStaticParams` (10 files have it); a slug outside the
  list is a 404 on Vercel (no `_fallback` rewrite runs there — `firebase.json` is dead config).
- `indexingApi.ts` reads `GOOGLE_INDEXING_SERVICE_ACCOUNT_KEY` — a server-only key; never called
  from a client component; and it cannot run in the static export.

## 5. Workflow for any UI change

1. **Locate** the live files and tokens (`git grep -n "<Component"`; `grep -n -- '--vk-' globals.css`).
2. **Classify** the ask: verified capability · roadmap idea · product decision (stop).
3. **Compose** from §2.
4. **Prove**: keyboard pass, accessible names (`aria-label` on icon-only buttons), contrast measured
   on the composited backdrop (text 4.5:1, UI boundaries 3:1), 320 px reflow without horizontal
   scroll, reduced motion respected (`globals.css` already zeroes animations under
   `prefers-reduced-motion`), the bottom nav band on phones, the sticky header on every page.
5. **Browser evidence**: `npm run dev` in the worktree after gates, open at 320 / 390 / 768 / 1024 /
   1440, record what was seen, state whether real Firebase credentials were used (without them the
   page throws `auth/invalid-api-key` ~2 s after paint and `npm run build` fails outright — a
   screenshot before that is not evidence).
6. **Report** exact paths, commands, exit codes, and what you did not do.

## 6. Validation commands

```bash
npx tsc --noEmit && npm run lint && npm run build          # the only real gates
git grep -nE '#[0-9a-fA-F]{6}\b' -- 'src/app/**/*.tsx' 'src/components/**/*.tsx' | wc -l   # hardcoded hex census (baseline first; report the delta)
git grep -nE '<(button|a)[^>]*>\s*<[A-Z][A-Za-z]+ (size|className)' -- 'src/**/*.tsx' | grep -v 'aria-label' | head   # icon-only controls without a name
git grep -n "'use client'" -- 'src/app/**/page.tsx' | wc -l                                    # client-page census (SEO pages should not be client-only)
```

## 7. Lane report

```
UIUX LANE — <phase>
Verdict: PASS | PASS_WITH_FINDINGS | BLOCKING
Components used (path) · raw-element grep result · new components: 0 (or STOP)
Tokens: hardcoded values introduced (path:line) · dark-theme classes introduced (path:line)
Template contracts: SectionType/DEFS/ACCESS consistency (command + result) or N/A
SEO: metadata present · JSON-LD complete · sitemap/robots updated · validateJobForPublishing on the publish path (yes/no/N/A)
Viewports checked: 320/390/768/1024/1440 — evidence · real Firebase credentials used: yes/no
Gates run: names + exit codes
Findings: severity · path:line · rule · fix
```
`BLOCKING` = a new component, a dark-theme regression, a template/section contract half-done, a
public page without metadata, a job publish path without validation, a missing `tamilLabel`.

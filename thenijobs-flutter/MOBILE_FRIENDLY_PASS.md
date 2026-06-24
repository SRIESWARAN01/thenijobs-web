# THENIJOBS Flutter — Mobile-Friendliness Pass

**Date:** 2026-06-09
**Scope:** `E:\thenijobs-main\thenijobs-flutter` (Flutter, Riverpod, GoRouter, Firebase) — responsiveness / small-screen behavior only.

> ⚠️ **Build not run.** The sandbox shell ran out of disk, so `flutter analyze` / `flutter build` could **not** be executed. The two edits below were verified by code review against current Flutter APIs. **Please run `flutter analyze` and a debug build before shipping.**

---

## Verdict

The Flutter app is **already substantially mobile-friendly.** The home screen wraps content in `SafeArea` + `SingleChildScrollView`; the hero and home widgets switch layout with an `isWide = MediaQuery.width > 900` breakpoint (Row ↔ Column); quick-action chips use `Wrap`; stat rows use `Expanded`; list text uses `maxLines` + `TextOverflow.ellipsis`; all three auth screens (login/register/forgot) wrap forms in `SingleChildScrollView`, so the on-screen keyboard never traps a field.

The gaps were narrow: no global text-scale guard, and a couple of fixed-column grids. Fixed below.

---

## Changes applied

### 1. Global text-scale clamp — `lib/main.dart` 🔴→✅
**Problem:** `MaterialApp.router` had no `builder`, so the OS accessibility font size flowed through unclamped. A user with "largest font" set could overflow tight rows (badges, stat cards, button rows) across every screen — the #1 cause of `RenderFlex overflow` on real devices.

**Fix:** added a `builder` that clamps `textScaler` to `0.85–1.2`, still honoring user preference within a safe range:

```dart
builder: (context, child) {
  final mediaQuery = MediaQuery.of(context);
  final clampedTextScaler = mediaQuery.textScaler.clamp(
    minScaleFactor: 0.85,
    maxScaleFactor: 1.2,
  );
  return MediaQuery(
    data: mediaQuery.copyWith(textScaler: clampedTextScaler),
    child: child ?? const SizedBox.shrink(),
  );
},
```

This single change hardens **every** screen against font-scaling overflow.

### 2. Pricing "All Plans Include" grid — `lib/features/public/presentation/screens/pricing_screen.dart` 🟡→✅
**Problem:** a hardcoded `crossAxisCount: 2, childAspectRatio: 4` grid of feature labels. On the narrowest phones, longer labels ("Tamil & English Support", "Admin Review Process") risk clipping.

**Fix:** made it responsive — single column with a taller cell on phones under 380px wide, 2 columns otherwise:

```dart
crossAxisCount: MediaQuery.of(context).size.width < 380 ? 1 : 2,
childAspectRatio: MediaQuery.of(context).size.width < 380 ? 6.5 : 4,
```

---

## Reviewed and left as-is (already fine on mobile)

- **`company_detail_screen.dart` gallery grid** — fixed `crossAxisCount: 3`, but they're square emoji tiles that render fine at 3-up even on a 360px screen. No change.
- **Home widgets** (`stats_section`, `categories_section`, `trending_jobs`, `featured_businesses`, `business_updates`, `own_creation_features`) — all already responsive via `isWide` (1–2 cols mobile, 3–6 wide).
- **Auth screens** — already scrollable; keyboard-safe.

---

## Recommended next (not done — need a build to verify safely)

1. **Run `flutter analyze`** — the prior repo audit reported ~136 analyzer issues, mostly deprecated `withOpacity()` (use `.withValues(alpha:)`), deprecated `ColorScheme.background`/`DropdownButtonFormField.value`, unused imports, and async-`context` usage. None are layout-breaking, but they're the bulk of the "make it correct" backlog.
2. **Test the 3 fixed-column grids on a 320px device** (smallest common width) once a build is available, to confirm the pricing/gallery cells.
3. **Device tap testing** — verify the updated 44px action controls on a physical small phone or emulator once a build is available.
4. **Replace the stale widget test** (`test/widget_test.dart` is the counter template and fails) with a `ProviderScope`-wrapped smoke test, so CI can guard these layout changes going forward.

---

## Files changed
- `lib/main.dart` — text-scale clamp (app-wide)
- `lib/features/public/presentation/screens/pricing_screen.dart` — responsive feature grid

---

## Continuation pass - tap targets and compact cards

Additional small-screen hardening was applied after the initial pass:

- Raised public job/business/service action buttons and phone/WhatsApp/save icon buttons from `36-38px` to `44px`.
- Raised horizontal category chip rails in the Businesses and Services screens from `38px` to `44px`.
- Gave the mobile home-card grids more vertical room where touch targets grew:
  - `trending_jobs.dart`: mobile card ratio `1.35 -> 1.2`
  - `featured_businesses.dart`: mobile card ratio `1.3 -> 1.15`
  - `business_updates.dart`: mobile feed card ratio `4.0 -> 3.4`

Additional files changed:
- `lib/features/public/presentation/screens/jobs_screen.dart`
- `lib/features/public/presentation/screens/businesses_screen.dart`
- `lib/features/public/presentation/screens/services_screen.dart`
- `lib/features/public/presentation/widgets/trending_jobs.dart`
- `lib/features/public/presentation/widgets/featured_businesses.dart`
- `lib/features/public/presentation/widgets/business_updates.dart`

---

## Continuation pass - constrained rows and dropdowns

Additional narrow-screen guardrails were added:

- Set `isExpanded: true` on public dropdowns that live inside compact search/filter rows.
- Made pricing plan names ellipsize inside the plan header so the price column remains visible on narrow phones.
- Let the footer copyright/legal row stack on mobile instead of squeezing into one horizontal row.

Additional files changed:
- `lib/features/public/presentation/widgets/hero_section.dart`
- `lib/features/public/presentation/widgets/search_hub.dart`
- `lib/features/public/presentation/widgets/home_footer.dart`

---

## Continuation pass - detail headers

Detail pages got a final narrow-screen pass:

- Company detail names now ellipsize instead of pushing the verified icon/action area.
- Company detail call/WhatsApp buttons now enforce a 44px minimum height.
- Job detail company names now ellipsize beside the verified icon.

Additional files changed:
- `lib/features/public/presentation/screens/company_detail_screen.dart`
- `lib/features/public/presentation/screens/job_detail_screen.dart`

# THENIJOBS Dynamic Billing Slogans — Administrator & Operator Guide

---

## 1. Overview

The **THENIJOBS Dynamic Billing Slogan Engine** automatically ensures that every customer receipt, tax invoice, quotation, or bill generated on the platform is printed with an official, culturally meaningful slogan in the customer's preferred language (**Tamil** or **English**).

As an Administrator, you can manage the entire 100-slogan master library, customize which slogans are assigned to each of the 14 billing services, add new slogans, and live-preview exactly how any slogan will render on an official A4 document.

---

## 2. Navigating to the Slogans Management Hub

1. Sign in to your authorized Admin account at `https://www.thenijobs.com/login`.
2. Open the Admin Sidebar and click **Billing Slogans** (or navigate directly to `/admin/slogans`).
3. You will see two primary views:
   - **Tab 1: Slogan Library:** View, search, filter, edit, and toggle all 100 slogans.
   - **Tab 2: Billing Models & Mappings:** Configure custom Tamil and English slogan pairings for each service type.

---

## 3. How Slogans are Selected (The 4-Tier Engine)

When an employer or business completes a transaction or views a bill, the platform resolves the slogan through 4 deterministic tiers:

1. **Tier 1 (Historical Snapshot):** If the bill was already created in the past, its original slogan text and cycle are **permanently locked**. Updating slogans today will never alter past invoices.
2. **Tier 2 (Billing Model Slogan):** The system checks if the service (e.g. `subscription_enterprise`, `job_posting`, `website_development`) has a custom assigned slogan.
3. **Tier 3 (Category Default):** If not specifically mapped, the default slogan for that category is used.
4. **Tier 4 (Global Default):** If unassigned, the platform falls back to `slogan_1` (Tamil) or `slogan_51` (English).

> **Language Rule:** Tamil bills always display Tamil slogans. English bills always display English slogans. There is zero risk of language cross-contamination.

---

## 4. Key Admin Actions

### A. Previewing a Slogan on a Real A4 Document
1. Locate any slogan in the table.
2. Click the **Eye icon (👁️)** in the Actions column.
3. A modal opens displaying an interactive simulation of an A4 document.
4. Use the document type dropdown at the top right to preview across:
   - **Tax Invoice**
   - **Payment Receipt**
   - **Bill of Supply**
   - **Quotation / Estimate**
5. Confirm that the tagline is centered, clear, and cleanly formatted without text clipping.

### B. Changing Slogans for a Specific Service / Plan
1. Switch to the **Billing Models & Mappings** tab.
2. Find the desired billing model (e.g., `subscription_enterprise` or `job_posting`).
3. Use the **Change தமிழ் Slogan** dropdown to pick a new Tamil slogan.
4. Use the **Change English Slogan** dropdown to pick a new English slogan.
5. The changes are saved automatically to Firestore (`systemSettings/billingModelSlogans`).

### C. Adding a New Custom Slogan
1. Click the **Add Slogan** button in the header.
2. Enter the slogan text.
3. Select Language (`தமிழ்` or `English`).
4. Select Category (`Business Growth`, `Recruitment`, `Trust & Quality`, `Theni Pride`, `Custom`).
5. Optionally associate with a specific billing model.
6. Check **Set as default slogan** if desired.
7. Click **Add to Library**.

### D. Syncing / Reseeding the Master Library
- **Sync 100 Slogans:** Checks if any of the approved 100 master slogans are missing and inserts them without touching custom slogans.
- **Reseed Defaults:** Restores the factory default 100 slogans and initial model pairings.
- **Reset Cycle:** Advances the rotation cycle counter and clears the cycle history so all active slogans become eligible again.

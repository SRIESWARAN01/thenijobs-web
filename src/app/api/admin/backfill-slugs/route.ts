import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { slugifyCompanyName } from '@/lib/companyPortfolio';

/**
 * Admin API: Backfill clean SEO slugs for all companies that don't have one.
 * 
 * This ensures every company gets a clean URL like /company/building-construction
 * instead of /company/building-construction-5uZ985nqGEbcMCLj3jwE
 * 
 * Duplicate slugs are handled with numeric suffixes:
 *   building-construction, building-construction-2, building-construction-3
 */
export async function POST() {
  try {
    // Fetch all companies
    const companiesSnap = await getDocs(collection(db, 'companies'));
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const results: Array<{ id: string; name: string; slug: string; action: string }> = [];

    // Build a set of already-taken slugs for fast dedup
    const takenSlugs = new Set<string>();
    companiesSnap.docs.forEach((d) => {
      const existing = d.data().slug;
      if (typeof existing === 'string' && existing.trim()) {
        takenSlugs.add(existing.trim());
      }
    });

    for (const companyDoc of companiesSnap.docs) {
      const data = companyDoc.data();
      const existingSlug = typeof data.slug === 'string' ? data.slug.trim() : '';
      
      // Skip companies that already have a clean slug
      if (existingSlug) {
        skipped++;
        continue;
      }

      const name = data.name || data.businessName || data.companyName || '';
      if (!name) {
        skipped++;
        results.push({ id: companyDoc.id, name: '(no name)', slug: '', action: 'skipped-no-name' });
        continue;
      }

      const baseSlug = slugifyCompanyName(name) || `company-${companyDoc.id.slice(0, 8)}`;

      // Find a unique slug
      let finalSlug = baseSlug;
      let suffix = 1;
      while (takenSlugs.has(finalSlug)) {
        suffix++;
        finalSlug = `${baseSlug}-${suffix}`;
      }

      try {
        await updateDoc(doc(db, 'companies', companyDoc.id), {
          slug: finalSlug,
          portfolioPath: `/company/${finalSlug}`,
          updatedAt: serverTimestamp(),
        });
        takenSlugs.add(finalSlug);
        updated++;
        results.push({ id: companyDoc.id, name, slug: finalSlug, action: 'updated' });
      } catch (err) {
        errors++;
        results.push({ id: companyDoc.id, name, slug: finalSlug, action: 'error' });
      }
    }

    return NextResponse.json({
      success: true,
      summary: { updated, skipped, errors, total: companiesSnap.size },
      results,
    });
  } catch (err) {
    console.error('[Slug Backfill] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to backfill slugs' },
      { status: 500 }
    );
  }
}

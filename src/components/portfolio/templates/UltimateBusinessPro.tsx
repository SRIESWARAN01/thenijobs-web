'use client';

import type { PortfolioSite } from '@/lib/types/portfolio';
import CorporatePremium from './CorporatePremium';

export default function UltimateBusinessPro({ site }: { site: PortfolioSite }) {
  // Ultimate template leverages the multi-section CorporatePremium engine with all sections unlocked
  return <CorporatePremium site={site} />;
}

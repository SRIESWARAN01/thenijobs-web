'use client';

import React, { useState, useMemo } from 'react';
import {
  Calculator, TrendingUp, Sparkles, CheckCircle2,
  DollarSign, ArrowRight, ShieldCheck, Zap,
  Building2, Store, Briefcase, Award, RotateCcw
} from 'lucide-react';
import {
  EARNING_TIERS_DATA,
  PRESET_MODELS,
  SPOTLIGHT_BADGE_COMMISSION,
  SPOTLIGHT_BADGE_PRICE,
  calculateEstimates,
  formatINR,
  PlanTierData,
  PresetKey,
} from '@/lib/ambassador/earningCalculator';

const TIER_ICONS: Record<string, any> = {
  basic: Store,
  standard: Building2,
  premium: Briefcase,
  enterprise: Award,
};

export const EARNING_TIERS = EARNING_TIERS_DATA.map(tier => ({
  ...tier,
  icon: TIER_ICONS[tier.id] || Store,
}));

export interface MonthlyEarningEstimatorProps {
  onCtaClick?: () => void;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
  includeSpotlightBonus?: boolean;
}

export default function MonthlyEarningEstimator({
  onCtaClick,
  ctaText = 'Claim Your Referral Code Now • குறியீடு பெறுக',
  ctaHref = '#signup-form',
  className = '',
  includeSpotlightBonus = true,
}: MonthlyEarningEstimatorProps) {
  // Plan Counts State
  const [counts, setCounts] = useState<{
    basic: number;
    standard: number;
    premium: number;
    enterprise: number;
  }>({
    basic: 5,
    standard: 6,
    premium: 4,
    enterprise: 2,
  });

  // Optional 48h Urgent Spotlight add-on count
  const [spotlightCount, setSpotlightCount] = useState<number>(8);

  const handleSliderChange = (id: 'basic' | 'standard' | 'premium' | 'enterprise', val: number) => {
    setCounts(prev => ({ ...prev, [id]: val }));
  };

  // Presets
  const applyPreset = (presetKey: PresetKey) => {
    const preset = PRESET_MODELS[presetKey];
    if (preset) {
      setCounts({
        basic: preset.counts.basic,
        standard: preset.counts.standard,
        premium: preset.counts.premium,
        enterprise: preset.counts.enterprise,
      });
      setSpotlightCount(preset.counts.spotlight ?? 0);
    }
  };

  // Computed Totals using authoritative helper
  const estimates = useMemo(() => {
    return calculateEstimates(
      {
        basic: counts.basic,
        standard: counts.standard,
        premium: counts.premium,
        enterprise: counts.enterprise,
        spotlight: spotlightCount,
      },
      includeSpotlightBonus
    );
  }, [counts, spotlightCount, includeSpotlightBonus]);

  const {
    totalShops,
    shopCommissionTotal: planEarnings,
    subtotals,
    totalMonthlyIncome: totalMonthlyEarnings,
    totalAnnualProjected: annualProjectedEarnings,
    effortPace,
  } = estimates;

  const spotlightEarnings = subtotals.spotlight;
  const paceText = effortPace.paceTa;

  return (
    <div
      id="calculator"
      className={`bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 border border-indigo-900/60 shadow-2xl relative overflow-hidden font-outfit ${className}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-3 shadow-xs">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <span>Monthly Earning Estimator • வருமான கணக்கீடு</span>
        </div>
        <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          See How Much You Can Earn
        </h3>
        <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
          Adjust the sliders below to estimate your monthly part-time or full-time commission by helping local businesses in your town:
        </p>

        {/* Preset Selector Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs text-slate-400 font-semibold mr-1">உடனடி மாதிரி:</span>
          <button
            type="button"
            onClick={() => applyPreset('part_time')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all cursor-pointer hover:border-emerald-500"
          >
            🌱 Part-Time (பகுதி நேரம்)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('active')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all cursor-pointer hover:border-blue-500"
          >
            🚀 Active Ambassador (முனைப்பு)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('superstar')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all cursor-pointer hover:border-purple-500"
          >
            👑 Superstar (முழு நேரம்)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('reset')}
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Reset Sliders"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Sliders, Right Dynamic Output Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Left Column: ALL 4 PLANS SLIDERS + OPTIONAL SPOTLIGHT */}
        <div className="lg:col-span-7 space-y-6">
          {EARNING_TIERS.map((tier) => {
            const count = counts[tier.id] || 0;
            const tierSubtotal = count * tier.commission;
            const Icon = tier.icon;

            return (
              <div
                key={tier.id}
                className="bg-slate-900/70 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-slate-800 hover:border-slate-700 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 border border-slate-700 shrink-0">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {tier.name} — <span className="text-emerald-400 font-black">{tier.commissionFormatted}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {tier.nameTa} • {tier.targetBizTa}
                      </p>
                    </div>
                  </div>

                  {/* Badge showing shops & subtotal */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {count} {count === 1 ? 'shop' : 'shops'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${tier.badgeColor}`}>
                      ₹{tierSubtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Slider bar */}
                <input
                  type="range"
                  min="0"
                  max={tier.maxVal}
                  value={count}
                  onChange={(e) => handleSliderChange(tier.id, Number(e.target.value))}
                  className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${tier.sliderAccent}`}
                />

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1">
                  <span>0 கடைகள்</span>
                  <span>{tier.maxVal / 2} கடைகள்</span>
                  <span>{tier.maxVal} கடைகள்</span>
                </div>
              </div>
            );
          })}

          {/* 48-Hour Urgent Hiring Spotlight Micro-Earning Slider */}
          {includeSpotlightBonus && (
            <div className="bg-rose-950/20 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-rose-900/40 hover:border-rose-800/60 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-900/40 flex items-center justify-center text-rose-300 border border-rose-800/40 shrink-0">
                    <Zap className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      Urgent 48h Spotlight Badges (₹99 / ₹149) — <span className="text-rose-400 font-black">₹35/badge</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      அவசர ஆட்கள் தேவை பேட்ஜ் • தாலுகா வாட்ஸ்அப் ஒளிபரப்பு கமிஷன்
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {spotlightCount} {spotlightCount === 1 ? 'badge' : 'badges'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-400/30">
                    ₹{(spotlightCount * SPOTLIGHT_BADGE_COMMISSION).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="30"
                value={spotlightCount}
                onChange={(e) => setSpotlightCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
              />

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1">
                <span>0 பேட்ஜ்</span>
                <span>15 பேட்ஜ்</span>
                <span>30 பேட்ஜ்</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: ESTIMATED MONTHLY INCOME DISPLAY */}
        <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-indigo-700/40 shadow-xl flex flex-col justify-between space-y-6">
          <div className="text-center">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
              Estimated Monthly Income • உத்தேச மாத வருமானம்
            </span>
            <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 my-2">
              ₹{totalMonthlyEarnings.toLocaleString('en-IN')}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-[11px] font-semibold text-slate-300 border border-slate-700/80">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ஆண்டு வருமானம்: <strong>₹{annualProjectedEarnings.toLocaleString('en-IN')} / yr</strong></span>
            </div>

            <p className="text-xs text-emerald-400 font-medium mt-3 bg-emerald-950/30 py-1.5 px-3 rounded-xl border border-emerald-900/30">
              🎯 {paceText}
            </p>
          </div>

          {/* Subtotal Itemized Breakdown */}
          <div className="bg-slate-950/70 rounded-2xl p-4 text-xs space-y-2 text-slate-300 border border-slate-800/80">
            <div className="flex justify-between items-center font-bold text-slate-400 text-[10px] uppercase pb-1 border-b border-slate-800">
              <span>திட்டம் (Plan Tier)</span>
              <span>கமிஷன் தொகை (Payout)</span>
            </div>

            {EARNING_TIERS.map(t => {
              const c = counts[t.id] || 0;
              const sub = c * t.commission;
              return (
                <div key={t.id} className="flex justify-between items-center">
                  <span className="text-slate-300">
                    {t.name.split(' ')[0]} ({c} × {t.commissionFormatted}):
                  </span>
                  <span className="font-bold text-white font-mono">
                    ₹{sub.toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}

            {includeSpotlightBonus && (
              <div className="flex justify-between items-center text-rose-300/90">
                <span>Urgent Badges ({spotlightCount} × ₹35):</span>
                <span className="font-bold text-rose-300 font-mono">
                  ₹{(spotlightCount * SPOTLIGHT_BADGE_COMMISSION).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div className="border-t border-slate-800 pt-2 flex justify-between items-center font-black text-emerald-400 text-sm">
              <span>Total Monthly Payout:</span>
              <span className="font-mono text-base">₹{totalMonthlyEarnings.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="space-y-1.5 text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>GPay, PhonePe, Paytm அல்லது வங்கிக் கணக்கில் நேரடி பட்டுவாடா</span>
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>உங்கள் அம்பாசிடர் டேஷ்போர்டில் உடனுக்குடன் நேரடி கண்காணிப்பு</span>
            </p>
          </div>

          {/* Action CTA */}
          {onCtaClick ? (
            <button
              type="button"
              onClick={onCtaClick}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <a
              href={ctaHref}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all text-center cursor-pointer active:scale-95"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

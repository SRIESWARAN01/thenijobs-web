'use client';

import { useState } from 'react';

const seekerSteps = [
  { step: '01', title: 'Create Profile', desc: 'Sign up and build your professional profile in minutes', icon: '👤' },
  { step: '02', title: 'Find Jobs', desc: 'Browse verified jobs matching your skills and location', icon: '🔍' },
  { step: '03', title: 'Apply', desc: 'Apply directly through the platform or employer channels', icon: '📨' },
  { step: '04', title: 'Get Hired', desc: 'Connect with employers and land your next opportunity', icon: '🎉' },
];

const employerSteps = [
  { step: '01', title: 'Register Company', desc: 'Create your company profile with business details', icon: '🏢' },
  { step: '02', title: 'Post Job', desc: 'Add job listings with salary, requirements and location', icon: '📋' },
  { step: '03', title: 'Review Candidates', desc: 'Browse applications and shortlist matching profiles', icon: '👥' },
  { step: '04', title: 'Hire', desc: 'Connect with candidates and build your local team', icon: '✅' },
];

const stepColors = [
  { bg: '#EFF6FF', border: '#DBEAFE' },
  { bg: '#ECFDF5', border: '#D1FAE5' },
  { bg: '#FFFBEB', border: '#FDE68A' },
  { bg: '#F5F3FF', border: '#DDD6FE' },
];

export default function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<'seeker' | 'employer'>('seeker');
  const steps = activeTab === 'seeker' ? seekerSteps : employerSteps;

  return (
    <section className="py-14" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-800 text-xs font-semibold mb-3">
            🚀 Simple Process
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-gray-900"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            How It Works
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveTab('seeker')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'seeker'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            For Job Seekers
          </button>
          <button
            onClick={() => setActiveTab('employer')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'employer'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            For Employers
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line (desktop) */}
          <div
            className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5"
            style={{ background: 'linear-gradient(90deg, #DBEAFE, #D1FAE5, #FDE68A, #DDD6FE)' }}
          />

          {steps.map((item, i) => (
            <div key={item.step} className="text-center">
              <div
                className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl text-2xl mb-4 border-2"
                style={{ background: stepColors[i].bg, borderColor: stepColors[i].border }}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[11px] font-bold text-white flex items-center justify-center"
                  style={{ background: activeTab === 'seeker' ? '#2563EB' : '#059669' }}
                >
                  {i + 1}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1.5">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

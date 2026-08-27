'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Is THENIJOBS free for job seekers?',
    a: 'Yes. Job seekers can create a profile, search jobs, and apply to any listing on THENIJOBS completely free of charge.',
  },
  {
    q: 'How can I apply for a job?',
    a: 'Browse jobs on the Jobs page, click on any listing that interests you, and use the Apply button to submit your application or contact the employer directly.',
  },
  {
    q: 'How do I register my company?',
    a: 'Go to the Employer section, click "Register Company", and fill in your business details. Our team reviews employer information before publishing eligible listings.',
  },
  {
    q: 'How can I post a job?',
    a: 'After registering your company, navigate to your Employer Dashboard and click "Post a Job". Fill in the job details and submit for review.',
  },
  {
    q: 'Are employers verified?',
    a: 'We review employer and business information before publishing eligible job listings. If you encounter a suspicious listing, please use the Report option.',
  },
  {
    q: 'Can I find jobs near my location?',
    a: 'Yes. THENIJOBS focuses on local opportunities across Theni, Cumbum, Periyakulam, Bodinayakanur, Madurai, Dindigul and surrounding areas. Use the location filter to narrow results.',
  },
  {
    q: 'Can I create a resume or profile?',
    a: 'Yes. Create your free job seeker profile with your skills, experience, and preferences. This helps employers discover you and speeds up your applications.',
  },
  {
    q: 'How do I report a suspicious job?',
    a: 'If you see a listing that seems suspicious or fraudulent, use the Report button on the job details page or contact us through WhatsApp or email.',
  },
];

function FAQItem({ faq, isOpen, onToggle }: { faq: typeof faqs[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span>{faq.q}</span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
          <p className="pt-3">{faq.a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };

  return (
    <section className="py-14" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-800 text-xs font-semibold mb-3">
            ❓ Help & Info
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-gray-900"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Everything you need to know about using THENIJOBS
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

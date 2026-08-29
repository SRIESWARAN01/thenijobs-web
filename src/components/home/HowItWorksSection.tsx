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
  return (
    <section className="py-14" style={{ background: '#F8FAFC' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-800 text-xs font-semibold mb-3">
            🚀 Simple 4-Step Process
          </div>
          <h2
            className="text-2xl sm:text-3xl font-bold text-gray-900"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            How THENIJOBS Works
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Simple, transparent, and direct connection between job seekers and employers
          </p>
        </div>

        {/* For Job Seekers */}
        <div className="mb-12 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
              For Job Seekers
            </span>
            <span className="text-xs text-gray-500 font-medium">100% Free Forever</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {seekerSteps.map((item, i) => (
              <div key={item.step} className="text-center sm:text-left flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
                <div
                  className="relative inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl text-xl shrink-0 border-2"
                  style={{ background: stepColors[i].bg, borderColor: stepColors[i].border }}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center bg-blue-600">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* For Employers */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
              For Employers &amp; Business Owners
            </span>
            <span className="text-xs text-gray-500 font-medium">Hire Verified Local Talent</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {employerSteps.map((item, i) => (
              <div key={item.step} className="text-center sm:text-left flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
                <div
                  className="relative inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl text-xl shrink-0 border-2"
                  style={{ background: stepColors[i].bg, borderColor: stepColors[i].border }}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center bg-emerald-600">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

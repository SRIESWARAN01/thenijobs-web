export default function JobsLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      {/* Header placeholder */}
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4 animate-pulse">
        {/* Search bar skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
        {/* Job cards skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-6 bg-gray-100 rounded-full w-20" />
                    <div className="h-6 bg-gray-100 rounded-full w-24" />
                    <div className="h-6 bg-gray-100 rounded-full w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

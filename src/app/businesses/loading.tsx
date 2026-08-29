export default function BusinessesLoading() {
  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded-lg w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded-lg w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

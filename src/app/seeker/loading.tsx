export default function SeekerLoading() {
  return (
    <div className="animate-pulse space-y-4 sm:space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded-lg w-48" />
            <div className="h-3 bg-gray-100 rounded-lg w-32" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="h-8 bg-gray-200 rounded-lg w-12 mb-2" />
            <div className="h-3 bg-gray-100 rounded-lg w-20" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="h-5 bg-gray-200 rounded-lg w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

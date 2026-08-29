export default function EmployerLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-5 animate-pulse">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded-lg w-48" />
            <div className="h-3 bg-gray-100 rounded-lg w-32" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

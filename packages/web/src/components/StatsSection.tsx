export function StatsSection() {
  const stats = [
    { value: '99.7%', label: 'Reconciliation Accuracy' },
    { value: '<50ms', label: 'Average API Latency' },
    { value: '50+', label: 'Platform Integrations' },
    { value: '10M+', label: 'Transactions Reconciled' },
  ];

  return (
    <div className="py-16 bg-white/50 dark:bg-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base text-slate-600 dark:text-slate-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

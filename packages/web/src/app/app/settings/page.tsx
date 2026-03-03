export default function SettingsPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="rounded border border-slate-200 bg-white p-4 text-sm">
        <div>Environment: {process.env.NODE_ENV ?? "development"}</div>
        <div className="text-slate-600">
          API keys and auth settings follow existing OSS auth configuration.
        </div>
      </div>
    </div>
  );
}

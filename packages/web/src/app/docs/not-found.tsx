import Link from "next/link";

export default function DocsNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
          Documentation not found
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          The documentation page you are looking for does not exist. It may have been moved or
          renamed.
        </p>
        <Link
          href="/docs"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to documentation
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="label">404</div>
      <h1 className="text-xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
      <p className="text-xs text-muted max-w-sm">The link may be out of date, or the problem was renamed. Search with Ctrl/Cmd + K, or start from one of these.</p>
      <div className="flex flex-wrap justify-center gap-2 mt-1">
        <Link className="btn" href="/">Dashboard</Link>
        <Link className="btn" href="/problems">All problems</Link>
        <Link className="btn" href="/learn">Learn</Link>
      </div>
    </div>
  );
}

const variants = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  booked: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-sky-50 text-sky-700 border-sky-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  refunded: "bg-violet-50 text-violet-700 border-violet-200",
  unpaid: "bg-slate-100 text-slate-700 border-slate-200",
};

export function StatusBadge({ status, fallback = "N/A" }) {
  const normalizedStatus = String(status || fallback).toLowerCase();
  const className =
    variants[normalizedStatus] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {status || fallback}
    </span>
  );
}

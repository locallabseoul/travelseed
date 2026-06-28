import type { ReactNode } from "react";
import type { DashboardConfirmOptions } from "@/types/dashboard";

export function Badge({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "sand" | "gray" }) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    sand: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    gray: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  }[tone];

  return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function PrimaryButton({ children }: { children: ReactNode }) {
  return <button type="button" className="min-h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm">{children}</button>;
}

export function SecondaryButton({ children }: { children: ReactNode }) {
  return <button type="button" className="min-h-11 rounded-md bg-white px-5 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">{children}</button>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function ConfirmDialog({
  open,
  options,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  options: DashboardConfirmOptions | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open || !options) {
    return null;
  }

  const isDanger = options.tone === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-[0_24px_90px_rgba(15,23,42,0.22)]">
        <h2 className="text-xl font-semibold text-slate-950">{options.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{options.description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-md bg-white px-5 text-sm font-semibold text-slate-950 ring-1 ring-slate-200">
            {options.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-11 rounded-md px-5 text-sm font-semibold text-white ${isDanger ? "bg-red-700" : "bg-slate-950"}`}
          >
            {options.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function Field({ label, value, textarea }: { label: string; value: string; textarea?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-950">
      {label}
      {textarea ? (
        <textarea value={value} readOnly rows={4} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 outline-none" />
      ) : (
        <input value={value} readOnly className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none" />
      )}
    </label>
  );
}

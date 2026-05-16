import type { ReactNode } from "react";
import type { DashboardConfirmOptions } from "@/types/dashboard";

export function Badge({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "sand" | "gray" }) {
  const toneClass = {
    green: "bg-[#e6f0e7] text-[#1f5a45]",
    sand: "bg-[#f1e4c9] text-[#7b5b24]",
    gray: "bg-[#eef0ed] text-[#55605b]",
  }[tone];

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#e8dfd0] bg-white p-5 shadow-[0_18px_60px_rgba(54,43,29,0.07)] ${className}`}>{children}</section>;
}

export function PrimaryButton({ children }: { children: ReactNode }) {
  return <button type="button" className="min-h-11 rounded-full bg-[#18352f] px-5 text-sm font-semibold text-white shadow-sm">{children}</button>;
}

export function SecondaryButton({ children }: { children: ReactNode }) {
  return <button type="button" className="min-h-11 rounded-full bg-white px-5 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">{children}</button>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#edf0ea]">
      <div className="h-full rounded-full bg-[#2d6b50]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11241f]/45 px-4 py-6">
      <section className="w-full max-w-md rounded-2xl border border-[#e8dfd0] bg-white p-5 shadow-[0_24px_90px_rgba(17,36,31,0.22)]">
        <h2 className="text-xl font-semibold text-[#18352f]">{options.title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#6f7b74]">{options.description}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-full bg-white px-5 text-sm font-semibold text-[#18352f] ring-1 ring-[#d8cebb]">
            {options.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-11 rounded-full px-5 text-sm font-semibold text-white ${isDanger ? "bg-red-700" : "bg-[#18352f]"}`}
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
    <label className="grid gap-2 text-sm font-medium text-[#18352f]">
      {label}
      {textarea ? (
        <textarea value={value} readOnly rows={4} className="rounded-xl border border-[#d8cebb] bg-[#fbfaf7] px-3 py-3 text-sm leading-6 outline-none" />
      ) : (
        <input value={value} readOnly className="min-h-11 rounded-xl border border-[#d8cebb] bg-[#fbfaf7] px-3 text-sm outline-none" />
      )}
    </label>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/auth/HomeAccountNav";
import { renderResortTemplate } from "@/components/templates";
import { loadPreviewResort } from "@/components/create/preview-storage";
import type { Resort } from "@/types/resort";

export function PreviewSite() {
  const [resort, setResort] = useState<Resort | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setResort(loadPreviewResort());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return <main className="min-h-screen bg-[#f8f5ef]" />;
  }

  if (!resort) {
    return (
      <main className="min-h-screen bg-[#f8f5ef] px-5 py-6 text-[#18352f] sm:px-6">
        <AppHeader />
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="max-w-md rounded-md bg-white p-6 text-center shadow-[0_24px_80px_rgba(54,43,29,0.08)]">
            <h1 className="text-2xl font-semibold">No preview found</h1>
            <p className="mt-3 text-sm leading-6 text-[#51635b]">
              Create a preview first, then open it in a new tab.
            </p>
            <Link
              href="/create"
              className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-[#18352f] px-6 text-sm font-semibold text-white"
            >
              Back to builder
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return renderResortTemplate(resort, resort.template_id);
}

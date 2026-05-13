"use client";

import { useEffect } from "react";

export function PageViewTracker({ resortId, path }: { resortId: string; path: string }) {
  useEffect(() => {
    const payload = JSON.stringify({ resortId, source: "site_page", path });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/events/page-view", blob);
      return;
    }

    void fetch("/api/events/page-view", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: payload,
      keepalive: true,
    });
  }, [path, resortId]);

  return null;
}

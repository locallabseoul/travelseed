"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

type TrackedWhatsAppLinkProps = {
  href: string;
  resortId: string;
  source?: string;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "onClick">;

export function TrackedWhatsAppLink({
  href,
  resortId,
  source = "booking_cta",
  children,
  ...anchorProps
}: TrackedWhatsAppLinkProps) {
  function trackClick() {
    const payload = JSON.stringify({ resortId, source });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/events/whatsapp-click", blob);
      return;
    }

    void fetch("/api/events/whatsapp-click", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: payload,
      keepalive: true,
    });
  }

  return (
    <a href={href} onClick={trackClick} {...anchorProps}>
      {children}
    </a>
  );
}

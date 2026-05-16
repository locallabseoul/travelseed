# Travelseed UI Rules

Last updated: 2026-05-16

## Purpose

This document captures stable UI/UX rules for the public site and operator dashboard.

## Design Direction

Travelseed is an operational product for resort operators. Dashboard UI should feel calm, clear, and work-focused.

Use restrained layouts for operational surfaces:

- Dense but organized information.
- Predictable navigation.
- Clear editing states.
- Compact previews.
- Strong scanability.

Avoid marketing-style dashboard composition, oversized decorative sections, or duplicative navigation.

## Dashboard UX Rules

- Keep the current dashboard/page/content flow.
- For multi-page sites, `Pages` is the primary page/content management area.
- Avoid separate duplicate entry points for editing the same page content.
- Embedded page content should remain a practical single-column editor.
- Keep `Plan feature access` compact and collapsible.
- Preserve dirty-change guards for tab navigation and unload.
- Preserve confirmations for publish/unpublish and plan changes.

## Sidebar And Navigation

- Sidebar tab state lives in `DashboardShell`.
- `Content` on non-landing sites should resolve to `Pages`/`structure`.
- Notification badges should be concise counts, currently used for new inquiries.

## Pages UI

- Home page must not expose separate page hero upload.
- Home page should preview the site-level hero and direct users to the correct site-level hero editor.
- Subpage hero previews should be compact `16:9` thumbnails with `max-w-md`.
- Page-level hero controls apply to subpages only.

## Offers UI

- Main dashboard label is `Offers`.
- Offer tabs are `Rooms`, `Packages`, and `Services`.
- Room-only fields appear only when `kind === "room"`.
- Offer editor should include a compact card preview.
- Image preview should stay intentionally small.
- Public `ServiceSection` card structure should remain stable while adding room details for room offers.

## Public Site UI

- Root `/{slug}` renders the main public site.
- Multi-page navigation should use configured navigation items when available.
- If no navigation items exist, use published pages.
- Landing navigation should use section anchors.
- Public pages should only render active/published content.
- Public template design behavior is governed by `docs/template-system.md`.
- Brand-level styling should flow through shared design tokens rather than one-off hardcoded styles.

## Copy And Terminology

- Use `Offers` for the shared room/package/service management area.
- Use `Rooms`, `Packages`, and `Services` for offer filters/tabs.
- Use plan names consistently: `Seed Trial`, `Seed`, `Tree`, `Forest`.
- Do not expose internal table names like `resort_services` in customer-facing UI.

## Interaction Rules

- Destructive or content-impacting actions need confirmation.
- Unsaved edits need clear guardrails before navigation.
- Plan lock messaging should explain what is available now and what requires upgrade.
- Downgraded features should feel locked/hidden, not deleted.

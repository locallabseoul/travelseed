# Travelseed Product Rules

Last updated: 2026-05-17

## Purpose

This document captures product policy, naming, plan behavior, and downgrade rules. Keep implementation topology in `architecture.md` and transient session state in `handoff.md`.

## Product Direction

Travelseed helps resort operators publish direct-booking websites and manage basic booking operations from an operator dashboard.

Current product surfaces:

- Public direct-booking resort site.
- Operator dashboard for site content, pages, offers, design, WhatsApp, inquiries, vouchers, domains, analytics, reviews, plans, and settings.
- Admin feature preset tooling.

## Plan Terminology

Display plans:

- `Seed Trial`
- `Seed`
- `Tree`
- `Forest`

Internal plan types:

- `freeTrial`
- `seed`
- `tree`
- `forest`

Site types:

- `landing`: one-page site.
- `multipage`: multi-page website.
- `custom`: premium/custom site platform.

Current mapping:

- Seed Trial -> Free Trial -> landing.
- Seed -> landing.
- Tree -> multipage.
- Forest -> custom.

## Plan Policy

General rules:

- Downgrade must never delete content.
- Higher-plan data should be locked or hidden on lower plans.
- Higher-plan data should be restored automatically when the site upgrades again.
- Plan behavior should be enforced in UI and, eventually, on the server.
- Deployment is not automatic. Deploy only when explicitly requested.

Current enforcement note:

- Plan behavior is mostly UI/public-rendering focused.
- Server-side entitlement enforcement exists for template catalog and site type saves; other feature entitlements should continue to be enforced as they are added.

## Page And CMS Policy

- Maintain the current multi-page architecture.
- Maintain the Pages-based CMS structure for multi-page plans.
- Do not collapse multi-page site management into one landing-page content editor.
- On non-landing sites, `Content` should route users into `Pages`.
- `Pages > selected page > Page content` is the correct embedded editing flow.

Home policy:

- Home is represented as `/` in page structure.
- Public `/{slug}` is the canonical Home URL.
- `/home` should redirect to `/{slug}` when encountered as a page slug.
- Home hero is site-level content, not page-level content.

Subpage policy:

- Subpage hero images are page-level overrides.
- Unpublished pages should not render publicly.
- Dining and Promotions preset pages may use structured fields stored in `site_pages.settings`.
- These structured preset fields are not separate CMS tables.
- Dining currently supports opening hours, breakfast info, and private dining notes.
- Promotions currently supports campaign notes plus offer-driven campaign cards.

## Offer Terminology

Use `Offers` in the admin/dashboard UI.

Internal offer tabs:

- `Rooms`
- `Packages`
- `Services`

Use offer terminology in new UI and types even though the DB table remains `resort_services`.

Correct model:

- One shared offer model.
- Kinds are `room`, `package`, and `service`.
- Room-only fields are only visible for room offers.

Do not create separate `rooms`, `packages`, and `services` tables unless the product explicitly changes its data model.

## Promotions Policy

- Promotions is a preset page powered by the shared Offers model.
- Do not create a separate promotions table or duplicate offer CMS for the current workflow.
- Package and service offers can be marked for the Promotions page from Offers.
- This uses `resort_services.highlight` as the campaign badge and placement signal.
- Active package/service offers with a campaign badge appear before fallback preset items on the public Promotions page.
- Room offer highlights remain room card badges and should not drive Promotions placement.

## Hero Policy

- Home uses `resorts.hero_image_url`.
- `Pages > Home` should show the site hero preview and direct users to `Page content > Hero`.
- `Pages > Home` should not support a separate page hero upload.
- Subpages may use `site_pages.hero_image_url`.

## Notification Policy

v1 notifications use existing business state, not a dedicated read/unread notification table.

Current notification source:

- New booking inquiries where `booking_inquiries.status = "new"`.

Current semantics:

- Changing an inquiry from `new` to another status removes it from the notification count.
- `DashboardNotificationSummary.items` is already shaped for a future popover/list.

## Voucher Policy

Vouchers are booking confirmations, not payments or inventory reservations.

Current v1 rules:

- Create vouchers from confirmed inquiries or as manual drafts.
- Keep voucher states simple: `draft`, `issued`, `void`.
- Only issued vouchers are publicly readable.
- Public voucher URL format is `/{slug}/vouchers/{publicToken}`.
- Vouchers should contain stay essentials: guest, contact, dates, guest count, offer/room label, amount note, included notes, and policy notes.
- Voucher room selection should reuse active `room` offers from the shared `resort_services` model through `booking_vouchers.room_offer_id`.
- `room_label` remains a denormalized/manual display label so old vouchers and custom room names still work even if the linked offer changes.
- Draft vouchers may be deleted.
- Issued vouchers should not be deleted; void them instead.
- Voided vouchers should not be edited.
- Do not add PDF export, payment capture, deposit logic, OTA sync, room inventory, or legal invoice semantics until the product explicitly expands beyond confirmation vouchers.

## Content Safety Rules

- Do not delete customer content as part of plan downgrade.
- Do not delete offers before a replacement write has succeeded.
- If an offer submission is intentionally empty, deleting all offers is allowed.
- Be careful with image replacement flows because uploaded files are not currently cleaned up automatically.

## Naming Guidance

Prefer:

- `site`
- `page`
- `offer`
- `room`
- `package`
- `service`
- `inquiry`
- `voucher`
- `review`

Avoid introducing new synonyms for the same product concept unless the UI copy is being deliberately revised.

## App Language Policy

Travelseed supports English and Bahasa Indonesia for core service UI.

Current v1 scope:

- Global language toggle in the shared app header.
- Marketing home page core copy.
- Login and account navigation copy.
- Site creation entry, AI import, account panel, and preview shell copy.
- Dashboard sidebar menu labels.
- Public resort navigation booking CTA.

Do not automatically translate operator/customer-authored resort content such as site names, page titles, offer descriptions, room labels, gallery text, reviews, inquiries, or voucher details. Those fields are business content and should remain exactly as entered unless a dedicated translation workflow is added.

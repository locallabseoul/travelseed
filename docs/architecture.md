# Travelseed Architecture

Last updated: 2026-05-17

## Purpose

This document captures stable implementation structure for AI agents and developers. Keep session-specific state in `docs/handoff.md`.

## Application Shape

Travelseed is a Next.js App Router application for direct-booking resort/operator sites.

Primary surfaces:

- Public tenant sites at `/{slug}`.
- Public multi-page subpages at `/{slug}/{pageSlug}`.
- Public issued booking vouchers at `/{slug}/vouchers/{publicToken}`.
- Legacy `/sites/{slug}` route that redirects to `/{slug}`.
- Operator dashboard at `/dashboard` and `/dashboard/[siteId]`.
- Admin tools at `/admin`.
- Create/preview flows at `/create` and `/preview`.

The current architecture is intentionally multi-page capable. Do not collapse it back to a one-page-only site model.

## Routing

Public routing:

- `app/[slug]/page.tsx` loads an active resort by slug and renders the selected public template.
- `app/[slug]/[pageSlug]/page.tsx` loads a published page for multi-page resorts.
- `app/sites/[slug]/page.tsx` redirects old `/sites/{slug}` URLs to root slug URLs.
- `pageSlug === "home"` redirects to `/{slug}`.
- Missing resorts, non-multi-page resorts, unpublished pages, and `page.slug === "/"` in the subpage route return 404.

Dashboard routing:

- `app/dashboard/page.tsx` is the dashboard entry.
- `app/dashboard/[siteId]/page.tsx` renders the selected site's dashboard shell.
- `components/dashboard/DashboardShell.tsx` owns active tab state, selected site state, notification state, unsaved-change guards, and tab rendering.

Operator API routing:

- `/api/operator/resorts` loads or creates operator-owned sites.
- `/api/operator/resorts/[id]` updates site-level resort data.
- `/api/operator/resorts/[id]/structure` manages pages, sections, and navigation.
- `/api/operator/resorts/[id]/services` manages the shared offers table.
- `/api/operator/resorts/[id]/inquiries` and nested inquiry routes manage booking inquiries.
- `/api/operator/resorts/[id]/vouchers` and nested voucher routes manage booking confirmation vouchers.
- `/api/operator/resorts/[id]/reviews` and nested review routes manage website reviews.
- `/api/operator/resorts/[id]/notifications` returns dashboard notification counts.
- `/api/operator/resorts/[id]/domain/recheck` handles domain verification refreshes.

## Dashboard Flow

`DashboardShell` maps tabs to feature views:

- `dashboard` -> `DashboardOverview`
- `setup` -> `SetupWizard`
- `content` -> `ContentManager` only for landing sites
- `content` on non-landing sites redirects to `structure`
- `structure` -> `SiteStructureManager`
- `offers` -> `OffersManager`
- `design` -> `DesignManager`
- `whatsapp` -> `WhatsAppManager`
- `inquiries` -> `InquiriesManager`
- `vouchers` -> `VouchersManager`
- `domain` -> `DomainManager`
- `analytics` -> `AnalyticsView`
- `reviews` -> `ReviewsView`
- `plan` -> `PlanBillingView`
- `settings` -> `SettingsView`

Important dashboard constraints:

- Multi-page plans use `Pages` as the main page/content area.
- `Pages > selected page > Page content` embeds `ContentManager`.
- Do not reintroduce separate duplicated Content and Pages workflows for multi-page sites.
- Dirty forms must keep confirmation guards for tab navigation and unload.
- Plan changes and publish/unpublish flows require confirmation.

## Data Flow

Public site data:

1. Public route calls `getActiveResortBySlug()` in `lib/tenants.ts`.
2. Supabase query selects `resorts` plus related `resort_services`, `website_reviews`, `site_sections`, `site_pages`, and `site_navigation_items`.
3. `sortedPublicSiteData()` in `lib/site-structure.ts` sorts services, reviews, sections, pages, and navigation.
4. Root public route renders `renderResortTemplate(resort, template)`.
5. Subpage route renders `ResortSubPage`.
6. Preset subpages resolve optional preset defaults through `lib/section-presets.ts` and saved `site_pages.settings`.
7. `PageViewTracker` records page views.

Template and brand design details live in `docs/template-system.md`.

Dashboard site data:

1. `DashboardShell` reads the Supabase auth session and bearer token.
2. `/api/operator/resorts` returns operator-manageable resorts with metrics.
3. `siteFromResort()` in `components/dashboard/data.ts` maps DB/API shape to `ResortConsoleData`.
4. Dashboard views mutate local `ResortConsoleData`.
5. `resortPayloadFromSite()` maps site-level dashboard state back to `ResortUpsert` for `/api/operator/resorts/[id]`.
6. Specialized resources such as offers, structure, inquiries, reviews, images, and notifications use dedicated API routes.

## Site Structure Model

Core helpers live in `lib/site-structure.ts`.

Site types:

- `landing`: one-page site using sections.
- `multipage`: Tree-level multi-page website.
- `custom`: Forest-level custom platform.

Plan behavior currently maps to site type through `components/dashboard/subscriptionConfig.ts`:

- `freeTrial` -> `landing`
- `seed` -> `landing`
- `tree` -> `multipage`
- `forest` -> `custom`

Default multi-page pages:

- Home `/`
- Rooms `/rooms`
- Experiences `/experiences`
- Gallery `/gallery`
- Reviews `/reviews`
- Blog `/blog`
- About `/about`
- Contact `/contact`
- Section presets from `lib/section-presets.ts`

`publishedSitePages()` merges saved pages with defaults for multi-page resorts. Custom saved pages are appended after default pages.

Section preset behavior:

- `lib/section-presets.ts` is the registry for reusable public page presets such as Dining, Promotions, Spa & Wellness, Activities, Nearby Attractions, and Weddings & Events.
- Presets define label, slug, page type, required plan, default publish state, layout intent, and lightweight content defaults.
- Preset content is stored in `site_pages.settings`; no separate preset table exists.
- The structure API persists `settings` with page records.
- The dashboard Pages UI edits preset title, intro, items, and CTA label inside the selected page.
- Public preset pages render through `ResortSubPage`, not through landing sections.
- Promotions may reuse active package/highlight rows from `resort_services` before falling back to saved preset items.

## Hero Ownership

- Home hero content is site-level data on `resorts.hero_image_url`, `resorts.hero_title`, and `resorts.hero_subtitle`.
- `site_pages.hero_image_url` is for subpage hero overrides only.
- `Pages > Home` must not upload or persist a separate page hero image.

Public fallback order:

- Home: `resorts.hero_image_url`, then first gallery image where relevant.
- Subpage: `site_pages.hero_image_url`, `resorts.hero_image_url`, first gallery image, then color-only fallback.

## Offers Model

The DB table remains `resort_services`, but the product and TypeScript model should refer to this as shared offers.

Supported offer kinds:

- `room`
- `package`
- `service`

Shared fields include:

- `title`
- `description`
- `price_label`
- `capacity`
- `image_url`
- `highlight`
- `duration`
- `included`
- `cta_label`
- `sort_order`
- `is_active`

Room-only fields include:

- `bed_type`
- `room_size`
- `view_type`
- `bathroom_info`
- `max_guests`
- `room_amenities`

Do not split `resort_services` into separate room/package/service tables without a deliberate migration plan.

## Database Structure

Main tables:

- `resorts`: tenant site, owner, plan, template, hero, content, domain, design, and publishing state.
- `resort_services`: shared offer model for rooms, packages, and services.
- `booking_inquiries`: direct booking inquiry records.
- `booking_vouchers`: issued or draft booking confirmation vouchers linked to an inquiry when available, and optionally linked to a room offer through `room_offer_id`.
- `site_events`: analytics events such as page views and WhatsApp clicks.
- `feature_presets`: admin-managed feature presets.
- `website_reviews`: manually managed public website reviews.
- `site_sections`: landing-page or site section configuration.
- `site_pages`: multi-page CMS page records and SEO/page hero metadata.
- `site_navigation_items`: custom navigation records.

Important migrations:

- `20260513134500_add_resort_design_settings.sql`: adds persisted resort design settings.
- `20260514120000_add_site_structure.sql`: adds `plan_type`, `site_type`, `site_sections`, `site_pages`, and `site_navigation_items`.
- `20260514133000_add_site_page_hero_image.sql`: adds `site_pages.hero_image_url`.
- `20260515103000_extend_resort_offers_room_fields.sql`: adds room-only fields to `resort_services`.
- `20260517090000_create_booking_vouchers.sql`: adds `booking_vouchers` and public read policy for issued vouchers.
- `20260517100000_add_room_offer_to_booking_vouchers.sql`: adds optional room offer linkage to vouchers.

## Type Locations

- Public/domain types: `types/resort.ts`
- Dashboard types: `types/dashboard.ts`
- Feature preset types: `types/feature-preset.ts`

Preferred offer names are `ResortOffer`, `ResortOfferKind`, `ResortOfferInput`, and `ResortOfferData`. Legacy `ResortService*` aliases remain for compatibility.

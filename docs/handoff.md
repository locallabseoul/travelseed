# Travelseed Handoff

Last updated: 2026-05-16

## Current Session State

Travelseed is a Next.js app for direct-booking resort/operator sites. Current work is focused on the customer operator console at `/dashboard/[siteId]` and public tenant sites at root slugs like `/{slug}`.

The working tree may be intentionally dirty with recent dashboard/admin/documentation changes. Do not revert unrelated user or generated changes.

Use these validation commands before handing off code changes:

```bash
npm run lint
npm run build
```

The latest implementation changes referenced by this handoff had passed both commands.

## Recent Implementation Changes

### Template System Documentation

- Added `docs/template-system.md` as the source of truth for public template design architecture.
- The template system is documented as a two-layer model:
  - `template_id` selects the public layout component.
  - `design_settings` stores brand-level styling choices applied through `designTokensFor()`.
- Current template IDs are `boutique-villa`, `surf-camp`, and `minimal-stay`.
- Current recommended direction is to normalize token usage, improve previews, clarify catalog/package naming, and expand with theme/section presets before adding many new template components.
- Keep multi-page architecture, Pages CMS, dashboard/page/content flow, and the `resort_services` shared offer model intact while improving templates.

### Template Token Normalization Pass

- Shared public CTA and footer surfaces now use `designTokensFor()` more consistently.
- `BookingSection` no longer defaults to hardcoded `bg-forest text-white`; it relies on token-derived button styling.
- `FooterSection` now derives background and text colors from design tokens.
- `HeroSection` fallback background and primary CTA use token colors and button style.
- `BoutiqueVillaTemplate` and `ResortSubPage` no longer pass hardcoded gold booking button classes.
- `ResortSubPage` now applies token text/background colors to its main wrapper and editorial placeholder.
- Shared public sections now use tokens more broadly:
  - `AboutSection`
  - `FeatureSection`
  - `ExperienceSection`
  - `GallerySection`
  - `ReviewSection`
  - `ServiceSection`
- `SurfCampTemplate` and `MinimalStayTemplate` now use design tokens more broadly for internal section colors, text, borders, fallback media, and booking areas.
- `DesignManager` responsive preview now branches by selected catalog/template category, uses token colors, and presents the mobile preview in an iPhone-style device frame.
- `DesignManager` responsive preview now includes a preview-only preset page summary derived from the plan's default Tree/Forest page set and `sectionPresets`.
- Desktop previews show preset page cards/chips under the template mock, and the iPhone-style preview shows compact preset chips.
- The Design menu persists the selected catalog card in `design_settings.templateCatalogName`, so catalog entries sharing one `templateId` can still restore distinct previews after save or reload. Public rendering still uses the underlying `template_id`.
- Template catalog definitions and plan checks were moved to `lib/template-catalog.ts`.
- Operator resort create/update APIs now validate template catalog entitlement server-side before saving.
- The entitlement check preserves unchanged existing template/catalog choices during non-destructive plan changes.

### Section Preset System V1

- Added `lib/section-presets.ts` as the shared registry for reusable page/section presets.
- Current presets:
  - Dining
  - Promotions
  - Spa & Wellness
  - Activities
  - Nearby Attractions
  - Weddings & Events
- Tree plans receive the Tree-eligible presets in the default page set.
- Forest plans additionally receive Forest-only presets.
- Preset defaults are stored through existing `site_pages.settings`; no new table or migration was added.
- `Pages > selected preset page > Page content` now shows a compact `Preset content` editor for title, intro, item list, and CTA label.
- The editor uses preset-specific labels, placeholders, and helper copy so Dining, Wellness, Activities, Local Guide, Events, and Promotions read as different workflows while keeping the same storage shape.
- Promotions structured fields now include `campaignNote`.
- Dining structured fields now include `openingHours`, `breakfastInfo`, and `privateDiningNote`.
- Public subpages for preset slugs render preset-specific content instead of the generic placeholder page.
- Public preset cards use preset-specific eyebrow and body copy.
- The Promotions preset can surface active package/service offers from the existing `resort_services` shared offer model when they have a campaign badge in `highlight`, including offer description, price label, and CTA label, then falls back to saved preset items.
- Offers now shows a `Show on Promotions page` placement control for package/service offers. It uses the existing `highlight` field as the campaign badge and placement signal.
- Added `npm run smoke:preset-routes` for local public preset route checks. Default check targets `http://localhost:3000/locallab/promotions`.
- Keep this as a lightweight preset layer. Do not replace Pages CMS, public subpage routing, or the shared offers model.

### Dashboard Pages And Content Flow

- Multi-page plans now use `Pages` as the main page/content management area.
- `Content` redirects into `Pages` for non-landing sites.
- `Pages > selected page > Page content` embeds `ContentManager` directly, so users can edit page content without duplicated menu hopping.
- Embedded page content is one column, not a cramped two-column grid.
- The old Pages right-side available/locked feature panels were replaced by a compact collapsible `Plan feature access` section.
- Publish/unpublish, plan changes, dirty form navigation, and page unload have confirmation/dirty guards.

Keep the current dashboard/page/content flow intact.

### Home Hero vs Page Hero

- Home uses the site-level hero from `resorts.hero_image_url`.
- `Pages > Home` does not allow a separate page hero upload.
- `Pages > Home` shows a site hero preview and points users to `Page content > Hero`.
- Subpages support `site_pages.hero_image_url` as page-level hero overrides.
- `pageToApi()` sends `hero_image_url: null` for `page.slug === "/"`.
- `uploadPageHero()` guards against Home uploads.
- Page hero previews in Pages are compact `16:9` thumbnails with `max-w-md` instead of wide panorama strips.

### Shared Offers Model

DB decision:

- Keep the existing `resort_services` table.
- Treat it as a common offer model for `room | package | service`.
- Do not split into `rooms`, `packages`, and `services` tables right now.

Applied migration:

- `supabase/migrations/20260515103000_extend_resort_offers_room_fields.sql`
- Adds room-only optional fields to `resort_services`:
  - `bed_type`
  - `room_size`
  - `view_type`
  - `bathroom_info`
  - `max_guests`
  - `room_amenities text[] not null default '{}'`

Naming:

- Preferred types:
  - `ResortOffer`
  - `ResortOfferKind = "room" | "package" | "service"`
  - `ResortOfferInput`
  - `ResortOfferData`
- Legacy aliases remain for compatibility:
  - `ResortServiceKind = ResortOfferKind`
  - `ResortService = ResortOffer`
  - `ResortServiceInput = ResortOfferInput`
  - `ResortServiceData = ResortOfferData`
- Admin menu is `Offers`.
- Admin internal tabs are `Rooms`, `Packages`, `Services`.
- Common offer fields remain `title`, `price_label`, `capacity`, `duration`, `highlight_badge`, `cta_label`, `description`, `included`, and `active`.
- Room-only fields show only for `kind === "room"`.

Public rendering:

- `ServiceSection.tsx` keeps the existing card structure.
- If an offer is `kind === "room"`, public cards additionally show room details and amenities.

Admin preview:

- Offer editor includes a compact card preview.
- Image preview is intentionally small.
- The card preview shows title, CTA label, badge, description, room details, and included items as the user edits.

### Offers Data Loss Incident And Fix

Observed issue:

- Public offers disappeared because remote `resort_services` had `0` rows.
- Root cause: before the room-field migration was applied remotely, a Room edit triggered the services API.
- The old API deleted existing `resort_services` rows first, then attempted insert.
- Insert failed due to schema mismatch, leaving the table empty.

Fix applied:

- `app/api/operator/resorts/[id]/services/route.ts` now inserts/replaces new rows before deleting old rows.
- If insert fails, existing rows are preserved.
- If the submitted list is intentionally empty, the API still deletes all offers and returns.

Current note:

- The defensive API fix prevents this deletion pattern from recurring.
- Existing lost rows must be restored manually or recreated in the UI if needed.

### Notification System v1

API:

- `app/api/operator/resorts/[id]/notifications/route.ts`
- Authenticates the operator and checks resort ownership.
- Currently counts `booking_inquiries` rows for the selected resort where `status = "new"`.
- Response shape uses `DashboardNotificationSummary`: `total`, `items`, `byTab`.

Types:

- `DashboardNotificationItem`
- `DashboardNotificationSummary`

UI:

- `DashboardShell` owns notification state for the selected site.
- `Sidebar` accepts `notificationsByTab`.
- `Inquiries` menu shows `N {count}` when there are new inquiries.
- `DashboardHeader` and `AppHeader` accept `notificationCount`.
- `HomeAccountNav` shows a profile badge when total notifications are greater than zero.
- Non-dashboard `AppHeader` usage remains backward-compatible because notification props are optional.

Inquiries behavior:

- `InquiriesManager` accepts `onNotificationsRefresh`.
- Creating a manual new inquiry refreshes global notifications.
- Updating inquiry status refreshes global notifications.
- v1 notification semantics are status-based, not read-receipt-based: changing a `new` inquiry to another status removes it from notifications.

### Setup Workflow Implementation

- `SetupWizard` is no longer a static mock checklist, but it is intentionally only a checklist hub.
- Setup does not directly edit every step. It tracks readiness and sends users to the responsible dashboard menu.
- Setup progress is derived from existing site fields instead of a new setup table.
- Six setup steps:
  - Business Info
  - OTA / Existing Info
  - Choose Template
  - AI Brand Copy
  - WhatsApp Booking
  - Preview & Publish
- Setup CTA destinations:
  - Business Info -> Settings
  - OTA / Existing Info -> Import
  - Choose Template -> Design
  - AI Brand Copy -> AI Copy
  - WhatsApp Booking -> WhatsApp
  - Preview & Publish -> Settings
- New dashboard menus:
  - `Import`
  - `AI Copy`
- `Import` supports public listing URL or pasted existing text.
- `AI Copy` is defined as a content-only site copy pack:
  - hero title
  - hero subtitle
  - about copy
  - feature bullets
  - experience themes
  - WhatsApp booking message
- Generated suggestions are previewed field-by-field and only selected fields are saved.
- `Settings` now includes a Preview & Publish panel with public URL preview and publish/pause action.
- New operator API route:
  - `app/api/operator/resorts/[id]/setup/generate/route.ts`
- OTA parsing and AI draft helpers were extracted to:
  - `lib/server/listing-draft.ts`
- Existing `/api/import-listing` now reuses the same helper.

## Immediate Next Work

1. Restore missing `resort_services` data if public offers need to appear immediately.
2. Run `npm run lint` and `npm run build` after code changes.
3. Keep documentation updates in the role-specific docs rather than expanding this handoff with stable reference material.
4. Use `docs/template-system.md` before changing template, design token, or Design menu behavior.
5. Use `lib/section-presets.ts` before adding new reusable public pages such as spa, dining, activities, events, or promotions.

## High-Signal File Map

- Dashboard shell and tab routing: `components/dashboard/DashboardShell.tsx`
- Setup checklist hub: `components/dashboard/SetupWizard.tsx`
- Import UI: `components/dashboard/ImportManager.tsx`
- AI Copy UI: `components/dashboard/AICopyManager.tsx`
- Shared draft review UI: `components/dashboard/SetupDraftTools.tsx`
- Dashboard sidebar badges: `components/dashboard/Sidebar.tsx`
- Dashboard header/profile badge: `components/dashboard/DashboardHeader.tsx`, `components/auth/HomeAccountNav.tsx`
- Notification API: `app/api/operator/resorts/[id]/notifications/route.ts`
- Setup generation API: `app/api/operator/resorts/[id]/setup/generate/route.ts`
- OTA/AI draft helper: `lib/server/listing-draft.ts`
- Inquiries UI: `components/dashboard/InquiriesManager.tsx`
- Pages/structure UI: `components/dashboard/SiteStructureManager.tsx`
- Embedded content editing: `components/dashboard/ContentManager.tsx`
- Offers UI: `components/dashboard/OffersManager.tsx`
- Offers API: `app/api/operator/resorts/[id]/services/route.ts`
- Public offer cards: `components/resort/ServiceSection.tsx`
- Dashboard data mapping: `components/dashboard/data.ts`
- Types: `types/dashboard.ts`, `types/resort.ts`
- Room-field migration: `supabase/migrations/20260515103000_extend_resort_offers_room_fields.sql`
- Template system reference: `docs/template-system.md`
- Section preset registry: `lib/section-presets.ts`

For stable architecture, product policy, UI rules, operations, and future work, use the other files in `docs/`.

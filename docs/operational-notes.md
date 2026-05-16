# Travelseed Operational Notes

Last updated: 2026-05-15

## Purpose

This document captures environment, build, Supabase, deployment, and testing notes.

## Local Environment

Expected environment file:

- `.env.local`

Supabase values are expected there. The app can fall back to sample data in some public-site paths when Supabase is not configured.

Common local command:

```bash
npm run dev
```

The dev server usually runs on port `3000`.

Stop any dev server before finishing work unless the user asks to keep it running.

## Validation

Use these checks after implementation changes:

```bash
npm run lint
npm run build
```

The latest implementation changes referenced by `docs/handoff.md` had passed both commands.

Preset page route smoke check:

```bash
npm run smoke:preset-routes
```

Defaults:

- Base URL: `http://localhost:3000`
- Resort slug: `locallab`
- Route path: `/promotions`

Overrides:

```bash
PRESET_ROUTE_BASE_URL=http://localhost:3000 PRESET_ROUTE_SLUG=locallab PRESET_ROUTE_PATHS=/promotions,/dining npm run smoke:preset-routes
```

Only include public routes that are published for the chosen resort slug. Draft preset pages should return 404 by design.

## Supabase

Image storage:

- Bucket: `resort-images`
- Public read policy is expected.
- Uploads are used for hero, page, gallery, and offer images.

Auth:

- Auth-gated operator APIs expect bearer tokens from the Supabase session.
- Operator API routes should authenticate the operator and verify resort ownership.

Migrations of interest:

- `20260510054000_create_resorts.sql`
- `20260510055500_create_resort_images_bucket.sql`
- `20260513103000_create_site_events.sql`
- `20260513110000_add_domain_status.sql`
- `20260513113000_create_resort_services.sql`
- `20260513120000_create_booking_inquiries.sql`
- `20260513123000_add_resort_plan.sql`
- `20260513131500_create_feature_presets.sql`
- `20260513133000_extend_resort_services.sql`
- `20260513134500_add_resort_design_settings.sql`
- `20260514103000_create_website_reviews.sql`
- `20260514120000_add_site_structure.sql`
- `20260514133000_add_site_page_hero_image.sql`
- `20260515103000_extend_resort_offers_room_fields.sql`

Remote migration note:

- Remote migration status was checked during the relevant session.
- `20260515103000` was present locally and remotely after `supabase db push`.

## API Safety Notes

Offer writes:

- `app/api/operator/resorts/[id]/services/route.ts` should insert/replace submitted rows before deleting old rows.
- This prevents losing existing offers if insertion fails because of schema mismatch or validation errors.
- An intentionally empty submitted list may still delete all offers.

Ownership:

- Several operator API routes duplicate ownership and auth helper logic.
- Extracting shared operator ownership checks is recommended but not yet done.

## Deployment

- Deployment should not be automatic.
- Deploy only when explicitly requested.
- Do not infer deploy permission from successful build or lint.

## Testing Notes

Current practical checks:

- Lint.
- Production build.
- Manual dashboard checks for page/content flow.
- Manual public route checks for root site and subpages.
- Manual offer edit checks when touching `resort_services`.
- Manual inquiry status checks when touching notifications.

Known missing coverage:

- Server-side plan entitlement tests.
- API regression tests for offer replace behavior.
- Dashboard unsaved-change guard tests.
- Public multi-page routing tests.
- Image replacement/cleanup tests.

# Travelseed Roadmap

Last updated: 2026-05-17

## Purpose

This document tracks known gaps, recommended next steps, and future features. Keep completed session details in `handoff.md`.

## Immediate Follow-Ups

1. Restore missing `resort_services` data if public offers need to be visible immediately.
   - Remote `resort_services` was observed as empty after the old delete-before-insert failure.
   - The API is now defensive, but lost rows were not automatically restored.

2. Add tests or manual verification around offer replacement.
   - The critical behavior is preserving existing offers when replacement insertion fails.

3. Keep documentation synced as implementation changes.
   - Update `architecture.md` for structural changes.
   - Update `product-rules.md` for policy changes.
   - Update `handoff.md` for current-session state.

## Recommended Engineering Work

- Expand preset route smoke checks beyond the default `/promotions` path when more preset pages are published in fixture data.
- Continue improving Design menu previews toward live public-template fidelity. Current previews include template category, design tokens, and preset page summaries.
- Add validation around `site_pages.settings` shape if preset settings grow beyond lightweight fields.
- Extract shared operator ownership checks.
- Add API regression tests for `resort_services` replacement writes.
- Add public route tests for `/{slug}` and `/{slug}/{pageSlug}`.
- Add API and public route tests for booking voucher issue/void/link behavior.
- Add dashboard tests for dirty form guards and plan/publish confirmations.
- Add image cleanup or replacement policy.

## Product Feature Gaps

- Notification popover/list.
- More notification sources:
  - Domain verification errors.
  - Plan limits.
  - Unpublished or draft warnings.
- Review requests.
- Voucher PDF export, payment/deposit states, and richer reservation lifecycle if booking operations expand beyond confirmation links.
- Dedicated CMS for Blog.
- Structured preset editors beyond the current lightweight title, intro, items, and CTA fields.
- More complete Promotions page workflow with date ranges, offer linking, and direct-booking campaign copy.
- Custom navigation builder for Forest/custom sites.
- Custom page creation for Forest/custom sites.

## Operational Gaps

- Automated deployment guidance is intentionally absent because deployment requires explicit user request.
- Supabase migration status should be checked before remote schema-dependent edits.
- Image uploads currently add files; old images are not deleted automatically when replaced.

## Future Architecture Considerations

- Use `docs/template-system.md` as the source of truth for template and brand design changes.
- Prefer theme presets and section presets before adding many new template components.
- Keep section presets as a lightweight layer over Pages until a page needs a real structured CMS.
- Keep `resort_services` as the shared offer model unless there is a strong product reason to split it.
- If splitting offers later, migrate data deliberately and preserve compatibility in public rendering.
- Keep multi-page rendering separate from landing section rendering.
- Keep plan downgrade behavior non-destructive.

# Travelseed Template System

Last updated: 2026-05-17

## Purpose

This document captures how Travelseed public site templates, design settings, and dashboard design controls work. Update this file when changing template behavior, design token behavior, template previews, or template catalog rules.

Keep session-specific work in `docs/handoff.md`. Keep broad dashboard UI rules in `docs/ui-rules.md`.

## Current Model

Travelseed templates use a two-layer model:

- `template_id` chooses the public layout component.
- `design_settings` stores brand-level styling choices that templates should apply through shared design tokens.

The template system should not replace the current multi-page architecture, Pages-based CMS, or shared offers model. Public root pages and public subpages must continue to use the current dashboard/page/content flow.

## Template Registry

Current public template IDs:

- `boutique-villa`
- `boutique-resort`
- `surf-camp`
- `minimal-stay`

Relevant code:

- `types/resort.ts` defines `ResortTemplateId` and `ResortDesignSettings`.
- `components/templates/index.tsx` registers template IDs and renders the selected component.
- `app/[slug]/page.tsx` loads the active resort and renders the selected template.
- `app/[slug]/[pageSlug]/page.tsx` renders multi-page CMS pages separately through the subpage renderer.

`renderResortTemplate(resort, templateOverride?)` allows a valid template override, then falls back to the resort's saved `template_id`. Unknown template IDs fall back to the boutique villa template.

## Design Settings

Dashboard design settings currently include:

- `colorTheme`
- `customColors`
- `logoUrl`
- `fontStyle`
- `buttonStyle`
- `imageStyle`
- `templateCatalogName`

`components/dashboard/DesignManager.tsx` owns the operator-facing Design menu. It lets operators choose a template catalog entry, customize the template's default colors, set a logo URL, font style, button style, and image style. Saving maps the underlying public layout back to `resorts.template_id` and brand/catalog metadata back to `resorts.design_settings`.

The dashboard template cards use static preview images when a catalog entry provides `previewImageUrl`; otherwise they fall back to generated gradient previews. The responsive preview renders the actual public template component with the current unsaved dashboard design choices, scaled into desktop and phone preview frames.

The responsive preview combines three inputs:

- selected template catalog entry
- current design tokens
- current dashboard content and offer data converted into public `Resort` shape

This preview does not mutate saved resort data or public rendering. It gives operators a compact live view of the selected public template before saving design settings.

## Design Token Contract

`lib/design-settings.ts` exposes `designTokensFor(settings)` for shared brand controls and `templatePaletteFor(templateId, settings)` for template-specific color mapping. Templates should use these helpers instead of hardcoding brand-dependent styling.

Current token output:

- `colorTheme`
- `customColors`
- `logoUrl`
- `fontStyle`
- `buttonStyle`
- `imageStyle`
- `colors.page`
- `colors.section`
- `colors.primary`
- `colors.accent`
- `colors.text`
- `colors.muted`
- `colors.buttonText`
- `buttonClassName`
- `imageClassName`
- `headingClassName`
- `bodyClassName`

`templatePaletteFor()` keeps each template's art direction intact while applying semantic slots such as page, section, hero, primary, accent, muted text, border, CTA, and inverse text. Use it for high-impact public surfaces such as hero backgrounds, room cards, CTA blocks, footer, price/accent text, and dashboard responsive previews.

`defaultEditableColorsForTemplate()` exposes the four operator-editable color defaults for the selected template. The dashboard Design menu should use those template defaults as the starting point instead of showing a separate global color theme selector.

Legacy color themes:

- `Sand`
- `Tropical Green`
- `Dark Luxury`
- `Minimal White`

`colorTheme` remains in `design_settings` for backward compatibility and older saved sites. It is no longer an operator-facing control in the Design menu. New dashboard color editing starts from the selected template's default palette and stores only valid overrides in `customColors`.

`customColors` is an optional brand override stored inside `design_settings` with up to four editable values:

- `primary`: main brand color for hero, navigation, footer, and major surfaces
- `accent`: emphasis color for CTAs, labels, prices, and decorative accents
- `page`: public site background color
- `text`: main body text color

Templates should derive secondary values such as section backgrounds, borders, muted text, CTA text, and inverse text from these semantic colors instead of exposing many raw color slots in the dashboard. Existing sites without `customColors` must continue to render from their saved `colorTheme` fallback or the default `Tropical Green` palette.

Current defaults:

- `colorTheme`: `Tropical Green` legacy fallback
- `customColors`: empty, using the selected template's default editable colors
- `fontStyle`: `Editorial Sans`
- `buttonStyle`: `Pill`
- `imageStyle`: `Soft Corners`

Template changes should treat these tokens and template palettes as the shared design contract. If a new brand-level visual control is added, add it to `ResortDesignSettings`, `designTokensFor()`, `templatePaletteFor()` when relevant, the dashboard Design menu, public template rendering, and this document.

## Template Implementation Status

`BoutiqueVillaTemplate` currently powers the Seed `Tropical Villa Landing` catalog entry. It is implemented as an immersive dark tropical villa landing page with a full-screen hero, villa highlights, room cards from active `room` offers, editorial gallery, reviews, and direct WhatsApp booking CTA. It keeps brand-level behavior connected to `designTokensFor()` while retaining template-specific tropical luxury styling.

`BoutiqueResortTemplate` powers the Tree `Boutique Resort Multi-page` catalog entry. It adapts the reference files in `template_ref/Boutique Resort/` into the current multipage architecture with a dark slate glass navigation, Playfair editorial headings, orange CTA treatment, data-driven rooms, and dedicated public subpage rendering through `BoutiqueResortSubPage`.

`SurfCampTemplate` uses token colors, button classes, image classes, and font classes in the hero, about, features, gallery, experiences, booking, and shared sections. Some overlay and structural styling remains template-specific.

`MinimalStayTemplate` currently powers the Seed `Sunset Landing` catalog entry. It is implemented as a warm sunset-style landing page with an image-led hero, active room cards, feature highlights, asymmetric gallery, review cards, direct booking CTA, and contact block. It uses the existing CMS/offer/review data model rather than hardcoded UXPilot content.

Shared public sections such as About, Features, Experiences, Gallery, Reviews, Services, Booking, Hero, Footer, and subpage editorial placeholders now use design tokens for the main brand-level color, typography, button, image, and border decisions. The dashboard Design menu preview also uses token colors, branches by selected catalog/template category, and shows the mobile preview in an iPhone-style frame.

`ResortSubPage` uses the same design settings for page background, main text color, subpage hero text, placeholder cards, booking CTA, navigation, and footer.

This is acceptable as the current state, but the intended direction is that all brand-level styling flows through `designTokensFor()` and `templatePaletteFor()` consistently. Template-specific art direction may remain, but it should not block custom color overrides, button style, image style, typography, or logo settings from applying predictably.

## Template Catalog And Plan Gating

`components/dashboard/subscriptionConfig.ts` defines the operator-facing template catalog and plan access.

Important distinction:

- Template catalog entries are product/package choices shown to operators.
- `templateId` is the underlying public layout component.

Multiple catalog entries may point to the same underlying `templateId` when the product package differs but the layout implementation is shared.

The Design menu stores the selected catalog entry in `design_settings.templateCatalogName`, so cards that share the same `templateId` can still restore distinct preview compositions after save or reload. Persisted public rendering still uses the underlying `template_id`.

Template catalog and plan access rules live in `lib/template-catalog.ts` so dashboard UI and operator APIs use the same template catalog source.

Template card preview images live in `public/template-previews/` and are linked from `templateCatalog` with `previewImageUrl`. Keep these images representative of the currently implemented React template, not only the original HTML reference, so operators see a reliable preview before selecting a template.

Operator create/update APIs validate template entitlement before saving:

- `plan_type` must map to the correct `site_type`.
- `design_settings.templateCatalogName`, when provided, must exist in the catalog.
- The catalog entry's `templateId` must match the saved `template_id`.
- The current plan must be able to use the catalog entry's required plan.
- Existing unchanged template/catalog selections remain valid during non-destructive plan changes.

## CMS And Offers Constraints

Do not break these constraints while changing templates:

- Keep the multi-page architecture.
- Keep Pages as the primary content management area for multi-page plans.
- Keep landing section rendering separate from multi-page subpage rendering.
- Keep `resort_services` as the shared offer model for rooms, packages, and services.
- Keep dashboard Setup as a checklist hub that routes users to responsible menus.
- Do not create duplicate edit surfaces for the same page/content workflow.

## Section Presets

Section presets are reusable multi-page content patterns, not full template components.

Relevant code:

- `lib/section-presets.ts` defines preset slugs, labels, plan access, page types, default content, and layout intent.
- `components/dashboard/subscriptionConfig.ts` uses the preset registry when building Tree and Forest page access.
- `lib/site-structure.ts` merges preset-backed default pages into multi-page public site data.
- `components/dashboard/SiteStructureManager.tsx` edits preset content through existing Pages.
- `components/resort/ResortSubPage.tsx` renders preset subpages publicly.

Current presets:

- Dining
- Promotions
- Spa & Wellness
- Activities
- Nearby Attractions
- Weddings & Events

Preset content is stored in `site_pages.settings` and currently supports title, intro, items, and CTA label. Promotions additionally supports a campaign note. Dining additionally supports opening hours, breakfast info, and private dining notes. This preserves the existing Pages CMS model and avoids a separate CMS table per vertical.

Preset definitions also carry editor labels, helper copy, and public card copy. This lets Dining, Wellness, Activities, Nearby Attractions, Events, and Promotions feel like distinct workflows without changing the stored settings shape.

The Promotions preset may reuse active package or service offers from `resort_services` when they have a campaign badge in `highlight`, including offer description, price label, and CTA label. This keeps direct booking offers connected to the shared offer model instead of introducing a second promotions data source.

Use section presets when a reusable page shape is needed across many resorts. Use a dedicated CMS only when the page needs richer structured records, complex workflows, or repeatable content beyond the lightweight preset settings.

## Template Change Checklist

When adding or changing a public template:

- Add or update the `ResortTemplateId` type.
- Register the component in `components/templates/index.tsx`.
- Add or update the operator-facing catalog entry in `subscriptionConfig.ts`.
- Add or update the template card preview image in `public/template-previews/` and connect it through `previewImageUrl`.
- Confirm the template uses `designTokensFor()` for brand-level colors, typography, buttons, images, and logo behavior.
- Confirm root `/{slug}` rendering still works.
- Confirm multi-page `/{slug}/{pageSlug}` rendering still works where applicable.
- Confirm landing sections, Pages CMS content, navigation, reviews, gallery, and shared offers still render correctly.
- Confirm section preset pages still render correctly for multi-page resorts.
- Update this document and any relevant roadmap notes.

## Recommended Evolution

Prioritize deeper reuse before adding many new template components:

1. Normalize design token usage across all existing templates.
2. Improve dashboard previews so they resemble actual public templates.
3. Clarify catalog package names versus underlying template IDs.
4. Keep server-side plan entitlement checks in sync as template catalog rules evolve.
5. Expand visual variety through stronger template defaults and richer section presets before adding many new template components.

Good future section preset improvements:

- Richer Dining menus or opening-hours fields.
- Spa treatment lists and inquiry categories.
- Wedding/event capacity, package, and venue fields.
- Activities schedule or partner tour fields.
- Nearby attraction distance and map metadata.
- Seasonal promotion date ranges and offer linking.

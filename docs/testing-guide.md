# Travelseed Staff Testing Guide

Last updated: 2026-05-18

## Purpose

This guide is for internal staff testing before broader customer feedback. Test the product as a resort operator: create a site, configure it in the dashboard, publish/check the public site, and validate inquiry and voucher workflows.

Default deployed test URL:

- `https://travelseed.vercel.app`

Use the deployed URL for staff testing unless local verification is needed. If testing locally, use `http://localhost:3000` and start the app with:

```bash
npm run dev
```

Korean guide: `docs/testing-guide.ko.md`

## Test Accounts

Recommended account coverage:

- New operator account: first-time sign-up and site creation.
- Existing operator account with one site: post-login redirect and site management.
- Existing operator account with multiple sites: site list and site switching.
- Small-screen tester: laptop or mobile-width browser for sidebar and preview checks.

Record the account email, site name, site slug, browser, device, and test date with each issue.

## Core Test Flow

Follow this order for a full pass:

1. Open the marketing home page.
2. Sign up or sign in.
3. Create a site using URL AI generation.
4. Create or review a site using manual entry.
5. Open the dashboard and complete Setup checklist items.
6. Edit Pages, Offers, Design, WhatsApp, Settings, and Publish state.
7. Open the public site and confirm the visible result.
8. Test inquiry, notification, and voucher workflows.
9. Repeat key checks on a small screen.

## Feature Checklist

### Home And Account Routing

- Home page loads without broken links.
- EN/ID language toggle is visible and persists after refresh.
- Switching language updates home, login, create, and shared navigation copy.
- Logged-out CTA routes to site creation.
- Logged-in users with existing sites route to site management.
- Logged-in users without sites route to site creation.
- Sample photo list is visible but does not link to a broken demo.

### Site Creation

- `/create` loads for a new operator.
- Manual entry can create a site with required fields.
- URL AI generation starts from a listing URL.
- While URL AI generation is running, the `Generate with AI` button shows a circular progress icon and disabled loading state.
- AI-generated draft fields can be reviewed and edited before creating the site.
- Image upload and template selection work without layout breaks.
- Successful creation routes the user into the management flow.

### Dashboard Shell

- `/dashboard` shows the operator's site list in a single wide-column layout.
- `/dashboard/[siteId]` opens the selected site.
- Dashboard sidebar menu labels respond to EN/ID language changes.
- Sidebar remains usable on smaller screens and does not cut off important menu items.
- Dashboard and Setup progress percentages match.
- Unsaved-change confirmation appears when leaving dirty forms.

### Setup

- Setup acts as a checklist hub, not a duplicate editor for every field.
- Each checklist CTA routes to the responsible menu.
- Business Info routes to Settings.
- OTA / Existing Info routes to Import.
- AI Brand Copy routes to AI Copy.
- Choose Template routes to Design.
- Preview & Publish routes to Settings.
- Readiness state updates from existing site data.

### Pages And Content

- Multi-page sites use Pages as the primary CMS surface.
- `Content` for non-landing sites resolves into Pages.
- Home, Rooms, Dining, Promotions, Reviews, and other preset pages appear according to plan.
- Publish/unpublish changes affect public page availability.
- Home uses the site-level hero, not a separate page hero upload.
- Subpages can use page-level hero images.
- Preset content editors save title, intro, item list, CTA label, and preset-specific fields.
- Public subpages render saved preset content.

### Offers

- Room, Package, and Service offers can be created, edited, and removed.
- Room-only fields appear only for room offers.
- Bed type, room size, occupancy, view, amenities, and booking labels save correctly.
- Package and Service offers can be marked for Promotions by adding a campaign badge.
- Public Rooms and Promotions pages reflect saved offers.
- Existing offers are not lost after a failed save.

### Design And Templates

- Template cards are selectable.
- Sunset, Tropical Villa, Boutique Resort, and Surf Camp previews display the correct design direction.
- Boutique Resort multi-page navigation handles many pages without breaking.
- Customise colors starts from the selected template's default palette.
- Color changes update dashboard preview and public rendering.
- Desktop/mobile responsive preview changes with the selected template category.
- Mobile preview keeps an iPhone-like frame and does not visibly crop important bottom content.
- WhatsApp floating button remains visible in public preview where expected.

### WhatsApp, Inquiries, And Notifications

- WhatsApp number and booking message can be saved.
- Public booking CTA opens the intended WhatsApp flow.
- New inquiries appear in Inquiries when test data is available.
- New inquiry count appears in dashboard notifications.
- Moving an inquiry out of `new` reduces the notification count.
- Confirmed inquiries can create or reuse a voucher draft.

### Vouchers

- Manual voucher drafts can be created.
- Voucher drafts can be created from confirmed inquiries.
- Selecting a room offer fills the display room label and related booking fields.
- Room label remains manually editable.
- Draft voucher fields save correctly.
- Issuing a voucher activates the public voucher link.
- Public voucher URL format is `/{slug}/vouchers/{publicToken}`.
- Copy link and WhatsApp share actions work for issued vouchers.
- Draft vouchers can be deleted.
- Issued vouchers are not deleted; they are voided.
- Voided vouchers are not editable as active confirmations.

### Settings And Publishing

- Basic site settings save correctly.
- Public URL preview is understandable.
- Publish and pause actions change public availability as expected.
- Password change validates current password, new password length, and confirmation match.
- After password change, the user can sign in again.

## Issue Report Format

Use this format for staff feedback:

```text
Test environment:
- URL:
- Device:
- Browser:
- Account:
- Site name / slug:

Problem location:
- Page URL:
- Dashboard menu:

Steps to reproduce:
1.
2.
3.

Expected result:

Actual result:

Screenshot or video:

Severity:
- Blocker / Major / Minor / Polish
```

## Acceptance Criteria

- A new operator can create a site without help.
- Setup gives clear next actions and routes to the correct menus.
- Dashboard is usable on small screens.
- Pages-based CMS and multi-page routing remain intact.
- Offers reliably update public Rooms and Promotions content.
- URL AI generation clearly shows progress.
- Template previews broadly match public rendering.
- Public site CTAs, inquiries, and vouchers support a basic direct-booking workflow.

## Out Of Scope For This Test Round

- Payment collection.
- OTA sync.
- Room inventory management.
- Voucher PDF export.
- Legal invoice or tax document behavior.
- Automated performance/load testing.

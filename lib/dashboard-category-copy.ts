import {
  businessCategoryFromType,
  type BusinessCategory,
  type BusinessCategoryId,
  type BusinessCategoryInput,
} from "@/lib/business-categories";
import type { ResortConsoleData, SiteStructurePage, SiteStructureSection, WebsiteReview } from "@/types/dashboard";
import type { ResortOfferKind } from "@/types/resort";

type DashboardCategoryInput =
  | string
  | BusinessCategoryInput
  | Pick<ResortConsoleData, "type" | "template">
  | Pick<ResortConsoleData, "type">
  | null
  | undefined;

export type DashboardMessagePreset = {
  label: string;
  fields: string[];
};

export type DashboardCategoryCopy = {
  category: BusinessCategory;
  setup: {
    offerMissing: string;
    copyMissing: string;
    contentFocus: string;
    offersStepTitle: string;
    offersStepDescription: string;
    contentStepDescription: string;
    inboxStepDescription: string;
  };
  pages: {
    offersLabel: string;
    secondaryLabel: string;
    specialLabel: string;
    offersDescription: string;
    secondaryDescription: string;
    featuresDescription: string;
    galleryDescription: string;
    secondaryInputLabel: string;
    secondaryEmptyText: string;
    promotionsDescription: string;
  };
  offers: {
    kindLabels: Record<ResortOfferKind, {
      label: string;
      selectLabel: string;
      badgeLabel: string;
      pricePlaceholder: string;
      capacityLabel: string;
      capacityPlaceholder: string;
      durationPlaceholder: string;
      pricePresets: string[];
      durationPresets: string[];
      highlightPresets: string[];
    }>;
    unsavedDescription: string;
    roomSelectHint: string;
  };
  whatsapp: {
    presets: DashboardMessagePreset[];
    additionalFieldLabel: string;
    previewReply: string;
  };
  confirmation: {
    eyebrow: string;
    title: string;
    body: string;
    createLabel: string;
    listLabel: string;
    emptyList: string;
    emptyDetail: string;
    includedDefault: string;
    policyDefault: string;
    offerTitleLabel: string;
    amountNoteLabel: string;
    saveLabel: string;
    savedStatus: string;
    createdStatus: string;
  };
  inquiries: {
    quickReplyLabels: string[];
  };
  reviews: {
    dateLabel: string;
    sampleReviews: Array<Pick<WebsiteReview, "guestName" | "rating" | "reviewText" | "sourceLabel" | "stayDate" | "status" | "showOnWebsite" | "featured" | "sortOrder">>;
  };
  analytics: {
    whatsappHelper: string;
    inquiriesHelper: string;
    conversionHelper: string;
    chartDescription: string;
    ctaSourceDescription: string;
  };
  design: {
    recommendation: string;
    recommendedTemplateNames: string[];
  };
  settings: {
    typeHelper: string;
  };
};

const roomKind = {
  label: "Room",
  selectLabel: "Room",
  badgeLabel: "room",
  pricePlaceholder: "From IDR 750K / night",
  capacityLabel: "Max guests",
  capacityPlaceholder: "2",
  durationPlaceholder: "Per night",
  pricePresets: ["From IDR ... / night", "Direct rate", "Per night", "Contact for rate"],
  durationPresets: ["Per night", "2 nights", "3 days / 2 nights", "Weekly stay"],
  highlightPresets: ["Best value", "Popular", "Private", "Family friendly", "Long stay"],
};

function copyFor(category: BusinessCategory, overrides: Omit<DashboardCategoryCopy, "category">): DashboardCategoryCopy {
  return { category, ...overrides };
}

const dashboardCategoryCopies: Record<BusinessCategoryId, DashboardCategoryCopy> = {
  accommodation: copyFor(businessCategoryFromType("Resort / Villa / Hotel"), {
    setup: {
      offerMissing: "rooms or stay packages",
      copyMissing: "guest-facing stay copy",
      contentFocus: "rooms, rates, availability, and guest services",
      offersStepTitle: "Rooms & Offers",
      offersStepDescription: "Add rooms, packages, rates, and guest services before promoting the site.",
      contentStepDescription: "Review hero, property story, gallery, and guest service highlights.",
      inboxStepDescription: "Use the inbox to track stay requests and issue booking vouchers after confirmation.",
    },
    pages: {
      offersLabel: "Rooms",
      secondaryLabel: "Services",
      specialLabel: "Dining",
      offersDescription: "Rooms, packages, rates, and stay offers shown on the Rooms page.",
      secondaryDescription: "Guest services, nearby experiences, dining notes, and local area highlights.",
      featuresDescription: "Amenities, guest benefits, facilities, and practical stay details.",
      galleryDescription: "Curated photos for rooms, property, facilities, food, and surrounding area.",
      secondaryInputLabel: "Services and local highlights, one per line",
      secondaryEmptyText: "No services or local highlights yet.",
      promotionsDescription: "Stay packages, room promos, and guest-facing WhatsApp offers.",
    },
    offers: {
      kindLabels: {
        room: roomKind,
        package: {
          label: "Package",
          selectLabel: "Stay package",
          badgeLabel: "package",
          pricePlaceholder: "From IDR 1.5M / package",
          capacityLabel: "Guests",
          capacityPlaceholder: "2",
          durationPlaceholder: "2 nights",
          pricePresets: ["From IDR ...", "Per package", "Per couple", "Contact for rate"],
          durationPresets: ["2 nights", "3 days / 2 nights", "Weekend", "Flexible"],
          highlightPresets: ["Best value", "Long stay", "Limited offer", "Family friendly"],
        },
        service: {
          label: "Service",
          selectLabel: "Guest service",
          badgeLabel: "service",
          pricePlaceholder: "From IDR 150K",
          capacityLabel: "Guests",
          capacityPlaceholder: "2",
          durationPlaceholder: "One way",
          pricePresets: ["From IDR ...", "Included", "Per person", "Contact for price"],
          durationPresets: ["One way", "Half day", "Full day", "Flexible"],
          highlightPresets: ["Popular", "Guest favorite", "Private", "New"],
        },
      },
      unsavedDescription: "You have room, package, or guest service changes that have not been saved. Continue without saving them?",
      roomSelectHint: "Rooms are available for accommodation businesses.",
    },
    whatsapp: {
      presets: [
        { label: "Stay booking", fields: ["Check-in:", "Check-out:", "Guests:", "Airport Pickup:"] },
        { label: "Room availability", fields: ["Room type:", "Check-in:", "Check-out:", "Guests:"] },
        { label: "Guest service", fields: ["Name:", "Contact:", "Service request:", "Preferred date or time:"] },
      ],
      additionalFieldLabel: "Airport pickup / notes field",
      previewReply: "Thanks. Please send your dates, guest count, and arrival details.",
    },
    confirmation: {
      eyebrow: "Vouchers",
      title: "Booking vouchers",
      body: "Create a guest-facing booking confirmation after a direct inquiry is confirmed.",
      createLabel: "New manual voucher",
      listLabel: "Voucher list",
      emptyList: "No vouchers yet. Create one from a confirmed inquiry or start a manual voucher.",
      emptyDetail: "Select a voucher to edit guest details and issue a public confirmation link.",
      includedDefault: "Accommodation booking confirmation.",
      policyDefault: "Please contact the business if your arrival time changes.",
      offerTitleLabel: "Stay offer title",
      amountNoteLabel: "Rate note",
      saveLabel: "Save voucher",
      savedStatus: "Voucher saved.",
      createdStatus: "Voucher draft created.",
    },
    inquiries: {
      quickReplyLabels: ["Ask dates", "Send rates", "Share stay offer", "Confirm booking"],
    },
    reviews: {
      dateLabel: "Stay Date",
      sampleReviews: [
        { guestName: "Maya T.", rating: 5, reviewText: "The room was calm, clean, and easy to book over WhatsApp. The team responded quickly and helped with our arrival.", sourceLabel: "Guest Message", stayDate: "Apr 2026", status: "published", showOnWebsite: true, featured: true, sortOrder: 0 },
        { guestName: "Daniel R.", rating: 5, reviewText: "Beautiful location and helpful service. It was simple to ask about availability and confirm the stay directly.", sourceLabel: "Manual", stayDate: "Apr 2026", status: "published", showOnWebsite: true, featured: true, sortOrder: 1 },
        { guestName: "Sari N.", rating: 4, reviewText: "Clean rooms, fast replies, and a relaxed setting. We would come back for a longer visit.", sourceLabel: "Google", stayDate: "Mar 2026", status: "draft", showOnWebsite: false, featured: false, sortOrder: 2 },
      ],
    },
    analytics: {
      whatsappHelper: "Room and stay inquiry intent",
      inquiriesHelper: "Saved stay conversations",
      conversionHelper: "Stay inquiries from page views",
      chartDescription: "Daily page views compared with stay inquiry intent.",
      ctaSourceDescription: "See which pages and room CTAs drive WhatsApp availability checks.",
    },
    design: {
      recommendation: "Hospitality templates are prioritized for room imagery, stay packages, and booking CTAs.",
      recommendedTemplateNames: ["Hospitality Website"],
    },
    settings: {
      typeHelper: "Changing this type updates dashboard labels, public navigation labels, offer presets, inquiry fields, and confirmation wording.",
    },
  }),
  food: copyFor(businessCategoryFromType("Cafe / Restaurant"), {
    setup: {
      offerMissing: "menu items or set menus",
      copyMissing: "menu and reservation copy",
      contentFocus: "menu highlights, table reservations, opening hours, and catering",
      offersStepTitle: "Menu & Offers",
      offersStepDescription: "Add menu items, set menus, reservations, and catering offers customers can ask about.",
      contentStepDescription: "Review hero, menu positioning, gallery, and catering or reservation content.",
      inboxStepDescription: "Use the inbox to track table requests, catering questions, and confirmed reservations.",
    },
    pages: {
      offersLabel: "Menu",
      secondaryLabel: "Catering",
      specialLabel: "Menu Details",
      offersDescription: "Menu items, set menus, table reservations, takeaway, and catering offers.",
      secondaryDescription: "Catering options, group dining notes, private events, and local food highlights.",
      featuresDescription: "Menu strengths, reservation benefits, opening details, and customer-facing food highlights.",
      galleryDescription: "Curated photos for dishes, drinks, storefront, team, and dining area.",
      secondaryInputLabel: "Catering, group dining, or food highlights, one per line",
      secondaryEmptyText: "No catering or food highlights yet.",
      promotionsDescription: "Set menus, seasonal promos, takeaway offers, and catering campaigns.",
    },
    offers: {
      kindLabels: {
        room: roomKind,
        package: {
          label: "Set menu",
          selectLabel: "Set menu",
          badgeLabel: "set menu",
          pricePlaceholder: "From IDR 150K / person",
          capacityLabel: "Party size",
          capacityPlaceholder: "4",
          durationPlaceholder: "Reservation window",
          pricePresets: ["From IDR ... / person", "Per set", "Group price", "Ask for menu"],
          durationPresets: ["Lunch", "Dinner", "Weekend", "Flexible time"],
          highlightPresets: ["Popular", "Group dining", "Limited offer", "Chef pick"],
        },
        service: {
          label: "Menu item",
          selectLabel: "Menu item",
          badgeLabel: "menu",
          pricePlaceholder: "From IDR 75K",
          capacityLabel: "People",
          capacityPlaceholder: "2",
          durationPlaceholder: "Dine-in or takeaway",
          pricePresets: ["From IDR ...", "Per portion", "Per person", "Ask for menu"],
          durationPresets: ["Dine-in", "Takeaway", "Delivery", "Same day"],
          highlightPresets: ["Popular", "Chef pick", "New", "Limited offer"],
        },
      },
      unsavedDescription: "You have menu, set menu, or catering offer changes that have not been saved. Continue without saving them?",
      roomSelectHint: "Room cards are hidden for food businesses unless existing accommodation data is present.",
    },
    whatsapp: {
      presets: [
        { label: "Table reservation", fields: ["Name:", "Contact:", "Preferred date or time:", "Party size:"] },
        { label: "Menu inquiry", fields: ["Name:", "Contact:", "Menu request:", "Takeaway or dine-in:"] },
        { label: "Catering request", fields: ["Name:", "Contact:", "Event date:", "Estimated guests:", "Request:"] },
      ],
      additionalFieldLabel: "Dietary / notes field",
      previewReply: "Thanks. Please send your preferred time, party size, and menu request.",
    },
    confirmation: {
      eyebrow: "Confirmations",
      title: "Reservation confirmations",
      body: "Create a customer-facing follow-up link after a table, menu, or catering inquiry is confirmed.",
      createLabel: "New reservation confirmation",
      listLabel: "Confirmation list",
      emptyList: "No confirmations yet. Create one from a confirmed inquiry or start a manual reservation confirmation.",
      emptyDetail: "Select a confirmation to edit customer details and issue a public follow-up link.",
      includedDefault: "Food and reservation confirmation.",
      policyDefault: "Please contact the business if your reservation time or party size changes.",
      offerTitleLabel: "Menu or reservation title",
      amountNoteLabel: "Price or deposit note",
      saveLabel: "Save confirmation",
      savedStatus: "Confirmation saved.",
      createdStatus: "Confirmation draft created.",
    },
    inquiries: {
      quickReplyLabels: ["Ask time", "Send menu", "Share offer", "Confirm reservation"],
    },
    reviews: {
      dateLabel: "Visit Date",
      sampleReviews: [
        { guestName: "Nadia P.", rating: 5, reviewText: "The reservation was quick over WhatsApp and the signature menu was exactly what we wanted for dinner.", sourceLabel: "Guest Message", stayDate: "Apr 2026", status: "published", showOnWebsite: true, featured: true, sortOrder: 0 },
        { guestName: "Arif S.", rating: 5, reviewText: "Friendly team, clear menu details, and a smooth group dining arrangement from the first message.", sourceLabel: "Manual", stayDate: "Mar 2026", status: "published", showOnWebsite: true, featured: true, sortOrder: 1 },
        { guestName: "Lina K.", rating: 4, reviewText: "Easy to ask about catering options and confirm the order. The food arrived on time.", sourceLabel: "Google", stayDate: "Mar 2026", status: "draft", showOnWebsite: false, featured: false, sortOrder: 2 },
      ],
    },
    analytics: {
      whatsappHelper: "Table, menu, and catering intent",
      inquiriesHelper: "Saved food conversations",
      conversionHelper: "Reservations from page views",
      chartDescription: "Daily page views compared with reservation and menu inquiry intent.",
      ctaSourceDescription: "See which menu pages and CTA buttons drive WhatsApp reservations.",
    },
    design: {
      recommendation: "Food templates are prioritized for menu cards, warm imagery, and fast reservation CTAs.",
      recommendedTemplateNames: ["Cafe & Restaurant Website"],
    },
    settings: {
      typeHelper: "Changing this type updates menu labels, reservation fields, WhatsApp presets, and confirmation wording.",
    },
  }),
  tour: copyFor(businessCategoryFromType("Tour Operator"), {
    setup: {
      offerMissing: "tour packages or itineraries",
      copyMissing: "tour and pickup copy",
      contentFocus: "tour packages, itineraries, pickup, and group size",
      offersStepTitle: "Tours & Packages",
      offersStepDescription: "Add tour packages, itineraries, pickup services, and group trip options.",
      contentStepDescription: "Review hero, tour story, gallery, itinerary notes, and pickup details.",
      inboxStepDescription: "Use the inbox to track trip requests, pickup questions, and confirmed tour follow-ups.",
    },
    pages: {
      offersLabel: "Tours",
      secondaryLabel: "Itineraries",
      specialLabel: "Trip Notes",
      offersDescription: "Tour packages, itineraries, pickup, group trips, and activity offers.",
      secondaryDescription: "Detailed itinerary ideas, pickup notes, local activities, and trip planning highlights.",
      featuresDescription: "Guide strengths, pickup options, group benefits, and practical trip details.",
      galleryDescription: "Curated photos for tours, activities, guides, transport, and destinations.",
      secondaryInputLabel: "Itineraries, pickup notes, or local highlights, one per line",
      secondaryEmptyText: "No itinerary or trip highlights yet.",
      promotionsDescription: "Tour promos, group packages, pickup offers, and seasonal campaigns.",
    },
    offers: {
      kindLabels: {
        room: roomKind,
        package: {
          label: "Tour",
          selectLabel: "Tour package",
          badgeLabel: "tour",
          pricePlaceholder: "From IDR 450K / person",
          capacityLabel: "Group size",
          capacityPlaceholder: "4",
          durationPlaceholder: "Full day",
          pricePresets: ["From IDR ... / person", "Per group", "Per package", "Request quote"],
          durationPresets: ["Half day", "Full day", "2 days / 1 night", "Flexible itinerary"],
          highlightPresets: ["Popular", "Private", "Group trip", "Local guide"],
        },
        service: {
          label: "Service",
          selectLabel: "Trip service",
          badgeLabel: "service",
          pricePlaceholder: "From IDR 150K",
          capacityLabel: "People",
          capacityPlaceholder: "2",
          durationPlaceholder: "One way",
          pricePresets: ["From IDR ...", "Per person", "Per group", "Request quote"],
          durationPresets: ["One way", "Half day", "Full day", "Flexible"],
          highlightPresets: ["Pickup", "Private", "Popular", "New"],
        },
      },
      unsavedDescription: "You have tour, package, or trip service changes that have not been saved. Continue without saving them?",
      roomSelectHint: "Room cards are hidden for tour operators unless existing accommodation data is present.",
    },
    whatsapp: {
      presets: [
        { label: "Tour availability", fields: ["Name:", "Contact:", "Tour or package:", "Preferred date:", "Group size:"] },
        { label: "Custom itinerary", fields: ["Name:", "Contact:", "Trip request:", "Preferred date:", "Pickup location:"] },
        { label: "Pickup request", fields: ["Name:", "Contact:", "Pickup location:", "Destination:", "Preferred time:"] },
      ],
      additionalFieldLabel: "Pickup / notes field",
      previewReply: "Thanks. Please send your tour date, group size, and pickup details.",
    },
    confirmation: {
      eyebrow: "Confirmations",
      title: "Tour confirmations",
      body: "Create a customer-facing follow-up link after a tour or pickup inquiry is confirmed.",
      createLabel: "New tour confirmation",
      listLabel: "Confirmation list",
      emptyList: "No confirmations yet. Create one from a confirmed inquiry or start a manual tour confirmation.",
      emptyDetail: "Select a confirmation to edit trip details and issue a public follow-up link.",
      includedDefault: "Tour inquiry confirmation.",
      policyDefault: "Please contact the business if your pickup location, date, or group size changes.",
      offerTitleLabel: "Tour or package title",
      amountNoteLabel: "Rate or deposit note",
      saveLabel: "Save confirmation",
      savedStatus: "Confirmation saved.",
      createdStatus: "Confirmation draft created.",
    },
    inquiries: {
      quickReplyLabels: ["Ask date", "Send itinerary", "Share tour offer", "Confirm pickup"],
    },
    reviews: {
      dateLabel: "Trip Date",
      sampleReviews: [
        { guestName: "Reno A.", rating: 5, reviewText: "The itinerary was clear, pickup was on time, and it was easy to confirm the tour over WhatsApp.", sourceLabel: "Guest Message", stayDate: "Apr 2026", status: "published", showOnWebsite: true, featured: true, sortOrder: 0 },
        { guestName: "Clara M.", rating: 5, reviewText: "Great local guide and flexible route. The team answered our questions quickly before the trip.", sourceLabel: "Manual", stayDate: "Mar 2026", status: "published", showOnWebsite: true, featured: true, sortOrder: 1 },
        { guestName: "Hadi P.", rating: 4, reviewText: "Good package for a small group. Pickup details and pricing were easy to understand.", sourceLabel: "Google", stayDate: "Mar 2026", status: "draft", showOnWebsite: false, featured: false, sortOrder: 2 },
      ],
    },
    analytics: {
      whatsappHelper: "Tour and itinerary inquiry intent",
      inquiriesHelper: "Saved trip conversations",
      conversionHelper: "Tour inquiries from page views",
      chartDescription: "Daily page views compared with trip inquiry and pickup intent.",
      ctaSourceDescription: "See which tour cards and itinerary pages drive WhatsApp planning.",
    },
    design: {
      recommendation: "Tour templates are prioritized for activity imagery, package cards, and itinerary-led pages.",
      recommendedTemplateNames: ["Tour Operator Website"],
    },
    settings: {
      typeHelper: "Changing this type updates tour labels, itinerary fields, pickup presets, and confirmation wording.",
    },
  }),
  local_service: copyFor(businessCategoryFromType("Shop / Local Service"), {
    setup: {
      offerMissing: "products or services",
      copyMissing: "product and service copy",
      contentFocus: "products, services, quote requests, delivery or pickup, and consultations",
      offersStepTitle: "Products & Services",
      offersStepDescription: "Add products, services, packages, delivery, pickup, or consultation offers.",
      contentStepDescription: "Review hero, business story, product/service highlights, gallery, and contact details.",
      inboxStepDescription: "Use the inbox to track quotes, orders, consultations, and customer follow-ups.",
    },
    pages: {
      offersLabel: "Products & Services",
      secondaryLabel: "Info",
      specialLabel: "Service Notes",
      offersDescription: "Products, services, packages, consultations, delivery, and pickup offers.",
      secondaryDescription: "Service details, business information, delivery notes, pickup details, and practical highlights.",
      featuresDescription: "Customer benefits, service strengths, delivery options, and business highlights.",
      galleryDescription: "Curated photos for products, services, storefront, team, and work examples.",
      secondaryInputLabel: "Service notes, delivery details, or business highlights, one per line",
      secondaryEmptyText: "No service notes or business highlights yet.",
      promotionsDescription: "Product promos, service bundles, quote campaigns, and local deals.",
    },
    offers: {
      kindLabels: {
        room: roomKind,
        package: {
          label: "Package",
          selectLabel: "Package",
          badgeLabel: "package",
          pricePlaceholder: "From IDR 250K / package",
          capacityLabel: "Request size",
          capacityPlaceholder: "1",
          durationPlaceholder: "Flexible",
          pricePresets: ["From IDR ...", "Per package", "Per order", "Request quote"],
          durationPresets: ["Same day", "1-2 days", "Weekly", "Flexible"],
          highlightPresets: ["Best value", "Popular", "Limited offer", "New"],
        },
        service: {
          label: "Service",
          selectLabel: "Product / service",
          badgeLabel: "service",
          pricePlaceholder: "From IDR 75K",
          capacityLabel: "Request size",
          capacityPlaceholder: "1",
          durationPlaceholder: "30 minutes",
          pricePresets: ["From IDR ...", "Per item", "Per service", "Request quote"],
          durationPresets: ["30 minutes", "Same day", "1-2 days", "Flexible"],
          highlightPresets: ["Popular", "New", "Best value", "Local favorite"],
        },
      },
      unsavedDescription: "You have product, service, or package changes that have not been saved. Continue without saving them?",
      roomSelectHint: "Room cards are hidden for local service businesses unless existing accommodation data is present.",
    },
    whatsapp: {
      presets: [
        { label: "Request quote", fields: ["Name:", "Contact:", "Product or service:", "Quantity or request size:", "Preferred date or time:"] },
        { label: "Order inquiry", fields: ["Name:", "Contact:", "Order request:", "Delivery or pickup:", "Preferred time:"] },
        { label: "Consultation", fields: ["Name:", "Contact:", "Service needed:", "Preferred date or time:"] },
      ],
      additionalFieldLabel: "Delivery / notes field",
      previewReply: "Thanks. Please send your request details, quantity, and preferred time.",
    },
    confirmation: {
      eyebrow: "Confirmations",
      title: "Quote and order follow-ups",
      body: "Create a customer-facing follow-up link after a quote, order, or service inquiry is confirmed.",
      createLabel: "New follow-up confirmation",
      listLabel: "Follow-up list",
      emptyList: "No follow-ups yet. Create one from a confirmed inquiry or start a manual follow-up.",
      emptyDetail: "Select a follow-up to edit customer details and issue a public confirmation link.",
      includedDefault: "Product or service inquiry confirmation.",
      policyDefault: "Please contact the business if your request, pickup, or delivery details change.",
      offerTitleLabel: "Product or service title",
      amountNoteLabel: "Quote or payment note",
      saveLabel: "Save follow-up",
      savedStatus: "Follow-up saved.",
      createdStatus: "Follow-up draft created.",
    },
    inquiries: {
      quickReplyLabels: ["Ask details", "Send quote", "Share offer", "Confirm follow-up"],
    },
    reviews: {
      dateLabel: "Service Date",
      sampleReviews: [
        { guestName: "Dewi R.", rating: 5, reviewText: "Fast WhatsApp replies and clear pricing. It was easy to ask questions and confirm the service.", sourceLabel: "Guest Message", stayDate: "Apr 2026", status: "published", showOnWebsite: true, featured: true, sortOrder: 0 },
        { guestName: "Bima S.", rating: 5, reviewText: "Helpful team, practical advice, and smooth pickup arrangements. The process felt simple from start to finish.", sourceLabel: "Manual", stayDate: "Mar 2026", status: "published", showOnWebsite: true, featured: true, sortOrder: 1 },
        { guestName: "Ayu N.", rating: 4, reviewText: "Good product details and quick confirmation. I knew exactly what to expect before visiting.", sourceLabel: "Google", stayDate: "Mar 2026", status: "draft", showOnWebsite: false, featured: false, sortOrder: 2 },
      ],
    },
    analytics: {
      whatsappHelper: "Quote, order, and service intent",
      inquiriesHelper: "Saved customer conversations",
      conversionHelper: "Inquiries from page views",
      chartDescription: "Daily page views compared with quote, order, and service inquiry intent.",
      ctaSourceDescription: "See which product or service CTAs drive WhatsApp requests.",
    },
    design: {
      recommendation: "Local business templates are prioritized for product/service cards and direct quote CTAs.",
      recommendedTemplateNames: ["Local Services Website", "Custom Business Platform"],
    },
    settings: {
      typeHelper: "Changing this type updates product/service labels, quote presets, inquiry fields, and follow-up wording.",
    },
  }),
  wellness: copyFor(businessCategoryFromType("Wellness / Salon"), {
    setup: {
      offerMissing: "treatments or appointment packages",
      copyMissing: "treatment and appointment copy",
      contentFocus: "treatments, appointments, duration, staff notes, and packages",
      offersStepTitle: "Treatments & Packages",
      offersStepDescription: "Add treatments, appointments, packages, duration, and staff-supported services.",
      contentStepDescription: "Review hero, treatment positioning, gallery, service benefits, and appointment details.",
      inboxStepDescription: "Use the inbox to track appointment requests, treatment questions, and confirmed bookings.",
    },
    pages: {
      offersLabel: "Treatments",
      secondaryLabel: "Packages",
      specialLabel: "Appointment Notes",
      offersDescription: "Treatments, appointment services, packages, wellness programs, and seasonal offers.",
      secondaryDescription: "Treatment packages, staff picks, consultation notes, and appointment preparation details.",
      featuresDescription: "Treatment benefits, staff strengths, appointment details, and customer-facing wellness highlights.",
      galleryDescription: "Curated photos for treatments, salon/spa interior, team, products, and results.",
      secondaryInputLabel: "Packages, appointment notes, or wellness highlights, one per line",
      secondaryEmptyText: "No package or appointment highlights yet.",
      promotionsDescription: "Treatment promos, wellness bundles, appointment campaigns, and seasonal offers.",
    },
    offers: {
      kindLabels: {
        room: roomKind,
        package: {
          label: "Package",
          selectLabel: "Treatment package",
          badgeLabel: "package",
          pricePlaceholder: "From IDR 350K / package",
          capacityLabel: "People",
          capacityPlaceholder: "1",
          durationPlaceholder: "90 minutes",
          pricePresets: ["From IDR ...", "Per package", "Per person", "Ask for price"],
          durationPresets: ["30 minutes", "60 minutes", "90 minutes", "Flexible"],
          highlightPresets: ["Best value", "Popular", "Limited offer", "Staff pick"],
        },
        service: {
          label: "Treatment",
          selectLabel: "Treatment",
          badgeLabel: "treatment",
          pricePlaceholder: "From IDR 150K",
          capacityLabel: "People",
          capacityPlaceholder: "1",
          durationPlaceholder: "60 minutes",
          pricePresets: ["From IDR ...", "Per treatment", "Per person", "Ask for price"],
          durationPresets: ["30 minutes", "60 minutes", "90 minutes", "Consultation"],
          highlightPresets: ["Popular", "Staff pick", "New", "Relaxing"],
        },
      },
      unsavedDescription: "You have treatment, appointment, or package changes that have not been saved. Continue without saving them?",
      roomSelectHint: "Room cards are hidden for wellness businesses unless existing accommodation data is present.",
    },
    whatsapp: {
      presets: [
        { label: "Book appointment", fields: ["Name:", "Contact:", "Treatment:", "Preferred date or time:"] },
        { label: "Treatment question", fields: ["Name:", "Contact:", "Treatment request:", "Preferred date or time:"] },
        { label: "Package inquiry", fields: ["Name:", "Contact:", "Package:", "Number of people:", "Preferred date:"] },
      ],
      additionalFieldLabel: "Treatment notes field",
      previewReply: "Thanks. Please send your preferred appointment time and treatment request.",
    },
    confirmation: {
      eyebrow: "Confirmations",
      title: "Appointment confirmations",
      body: "Create a customer-facing follow-up link after a treatment or appointment inquiry is confirmed.",
      createLabel: "New appointment confirmation",
      listLabel: "Confirmation list",
      emptyList: "No confirmations yet. Create one from a confirmed inquiry or start a manual appointment confirmation.",
      emptyDetail: "Select a confirmation to edit appointment details and issue a public follow-up link.",
      includedDefault: "Treatment appointment confirmation.",
      policyDefault: "Please contact the business if your appointment time or treatment request changes.",
      offerTitleLabel: "Treatment or package title",
      amountNoteLabel: "Price or deposit note",
      saveLabel: "Save confirmation",
      savedStatus: "Confirmation saved.",
      createdStatus: "Confirmation draft created.",
    },
    inquiries: {
      quickReplyLabels: ["Ask time", "Send treatment info", "Share package", "Confirm appointment"],
    },
    reviews: {
      dateLabel: "Appointment Date",
      sampleReviews: [
        { guestName: "Mira L.", rating: 5, reviewText: "Booking was simple over WhatsApp and the treatment details were clear before I arrived.", sourceLabel: "Guest Message", stayDate: "Apr 2026", status: "published", showOnWebsite: true, featured: true, sortOrder: 0 },
        { guestName: "Tania W.", rating: 5, reviewText: "Warm service, clean space, and helpful staff. I could ask about the package and confirm quickly.", sourceLabel: "Manual", stayDate: "Mar 2026", status: "published", showOnWebsite: true, featured: true, sortOrder: 1 },
        { guestName: "Rika P.", rating: 4, reviewText: "The appointment was easy to arrange and the team explained aftercare clearly.", sourceLabel: "Google", stayDate: "Mar 2026", status: "draft", showOnWebsite: false, featured: false, sortOrder: 2 },
      ],
    },
    analytics: {
      whatsappHelper: "Treatment and appointment intent",
      inquiriesHelper: "Saved appointment conversations",
      conversionHelper: "Appointments from page views",
      chartDescription: "Daily page views compared with appointment and treatment inquiry intent.",
      ctaSourceDescription: "See which treatment cards and appointment CTAs drive WhatsApp bookings.",
    },
    design: {
      recommendation: "Wellness templates are prioritized for treatment cards, calm imagery, and appointment CTAs.",
      recommendedTemplateNames: ["Wellness & Salon Website"],
    },
    settings: {
      typeHelper: "Changing this type updates treatment labels, appointment presets, inquiry fields, and confirmation wording.",
    },
  }),
};

function categoryFromDashboardInput(input: DashboardCategoryInput) {
  if (input && typeof input === "object" && "template" in input) {
    return businessCategoryFromType({ type: input.type, templateId: input.template });
  }

  return businessCategoryFromType(input as string | BusinessCategoryInput | null | undefined);
}

export function dashboardCategoryCopyFor(input: DashboardCategoryInput): DashboardCategoryCopy {
  return dashboardCategoryCopies[categoryFromDashboardInput(input).id];
}

function normalizedSlug(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

export function dashboardPageNameFor(pageOrSlug: Pick<SiteStructurePage, "slug" | "name"> | string, copy: DashboardCategoryCopy) {
  const slug = typeof pageOrSlug === "string" ? normalizedSlug(pageOrSlug) : normalizedSlug(pageOrSlug.slug);
  const fallback = typeof pageOrSlug === "string" ? pageOrSlug : pageOrSlug.name;

  if (!slug) return "Home";
  if (slug === "rooms") return copy.pages.offersLabel;
  if (slug === "experiences") return copy.pages.secondaryLabel;
  if (slug === "dining") return copy.pages.specialLabel;
  if (slug === "promotions") return "Promotions";

  return fallback;
}

export function dashboardPageDescriptionFor(pageOrSlug: Pick<SiteStructurePage, "slug"> | string, copy: DashboardCategoryCopy) {
  const slug = typeof pageOrSlug === "string" ? normalizedSlug(pageOrSlug) : normalizedSlug(pageOrSlug.slug);

  if (slug === "rooms") return copy.pages.offersDescription;
  if (slug === "experiences") return copy.pages.secondaryDescription;
  if (slug === "dining") return copy.pages.secondaryDescription;
  if (slug === "promotions") return copy.pages.promotionsDescription;

  return "Manage URL, publishing, SEO, and preview for this public page.";
}

export function dashboardSectionDisplay(section: SiteStructureSection, copy: DashboardCategoryCopy) {
  if (section.name === "Offers") {
    return { name: copy.pages.offersLabel, description: copy.pages.offersDescription };
  }

  if (section.name === "Business Highlights") {
    return { name: "Business Highlights", description: copy.pages.featuresDescription };
  }

  if (section.name === "Gallery") {
    return { name: "Gallery", description: copy.pages.galleryDescription };
  }

  if (section.name === "Promotion Banner") {
    return { name: "Promotion Banner", description: copy.pages.promotionsDescription };
  }

  return { name: section.name, description: section.description };
}

export function reviewSourceDisplayLabel(sourceLabel: WebsiteReview["sourceLabel"]) {
  return sourceLabel === "Guest Message" ? "Customer Message" : sourceLabel;
}

export function reviewSourceValueFromDisplay(label: string): WebsiteReview["sourceLabel"] {
  return label === "Customer Message" ? "Guest Message" : label as WebsiteReview["sourceLabel"];
}

export const reviewSourceDisplayOptions = ["Manual", "Google", "Customer Message"] as const;

export function categoryReviewSamples(site: Pick<ResortConsoleData, "type" | "template">) {
  return dashboardCategoryCopyFor(site).reviews.sampleReviews.map((review, index): WebsiteReview => ({
    id: `sample-review-${index + 1}`,
    ...review,
  }));
}

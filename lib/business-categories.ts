import type { Resort, ResortOfferKind } from "@/types/resort";

export type BusinessCategoryId = "accommodation" | "food" | "tour" | "local_service" | "wellness";

export type BusinessCategoryInput = {
  type?: string | null;
  templateId?: string | null;
};

export type BusinessCategory = {
  id: BusinessCategoryId;
  label: string;
  shortLabel: string;
  icon: string;
  heroPlaceholder: string;
  offerSectionTitle: string;
  offerSectionBody: string;
  servicesLabel: string;
  servicesPlaceholder: string;
  featurePlaceholder: string;
  emptyOfferDescription: string;
  primaryCta: string;
  secondaryCta: string;
  pricingFallback: string;
  capacityLabel: string;
  pageLabels: string[];
  sectionLabels: string[];
  landingNav: {
    offers: string;
    experiences: string;
  };
  quickPresets: string[];
  serviceDraftTitle: string;
  serviceDraftEmpty: string;
  defaultBookingMessage: (businessName: string) => string;
  inquiry: {
    eyebrow: string;
    title: string;
    body: string;
    namePlaceholder: string;
    requestLabel: string;
    requestPlaceholder: string;
    preferredTimeLabel: string;
    preferredTimePlaceholder: string;
    submitLabel: string;
    preferredDateLabel: string;
    sizeLabel: string;
    summaryFallback: string;
    quickReplies: string[];
  };
  offerSections: Record<ResortOfferKind, {
    title: string;
    description: string;
    addLabel: string;
    emptyTitle: string;
    emptyDescription: string;
  }>;
  offerOrder: ResortOfferKind[];
  ctaOptions: Record<ResortOfferKind, string[]>;
  includedOptions: Record<ResortOfferKind, string[]>;
  starterPresets: Record<ResortOfferKind, Array<{
    label: string;
    patch: {
      title?: string;
      ctaLabel?: string;
      highlight?: string;
      duration?: string;
      included?: string[];
      bedType?: string;
      bathroomInfo?: string;
      maxGuests?: string;
    };
  }>>;
};

const defaultOfferSections: Record<ResortOfferKind, BusinessCategory["offerSections"][ResortOfferKind]> = {
  service: {
    title: "Services",
    description: "Core services, products, menu items, treatments, rentals, activities, or local business offers.",
    addLabel: "Add Service",
    emptyTitle: "No services yet",
    emptyDescription: "Add the offers customers should ask about first on WhatsApp.",
  },
  package: {
    title: "Packages",
    description: "Bundled offers such as promos, set menus, tours, wellness programs, local deals, or service bundles.",
    addLabel: "Add Package",
    emptyTitle: "No packages yet",
    emptyDescription: "Create packages when customers usually buy or reserve multiple items together.",
  },
  room: {
    title: "Rooms",
    description: "Optional accommodation units such as villas, suites, dorms, or private rooms.",
    addLabel: "Add Room",
    emptyTitle: "No rooms yet",
    emptyDescription: "Use rooms only when this business offers accommodation.",
  },
};

const defaultCtaOptions: Record<ResortOfferKind, string[]> = {
  room: ["Ask availability", "Check availability", "Book this room"],
  package: ["Ask about this package", "Request package", "Contact via WhatsApp"],
  service: ["Inquire", "Ask details", "Book via WhatsApp"],
};

const defaultIncludedOptions: Record<ResortOfferKind, string[]> = {
  room: ["Breakfast", "Daily housekeeping", "Pool access", "WiFi"],
  package: ["Service", "Consultation", "Transport", "Guide"],
  service: ["Staff support", "Materials", "Equipment", "WhatsApp confirmation"],
};

const defaultStarterPresets: BusinessCategory["starterPresets"] = {
  room: [
    { label: "Private Room", patch: { title: "Private Room", ctaLabel: "Check availability", highlight: "Private", included: ["WiFi", "Daily housekeeping"], bedType: "Queen bed", bathroomInfo: "Private bathroom", maxGuests: "2" } },
    { label: "Family Room", patch: { title: "Family Room", ctaLabel: "Ask availability", highlight: "Family friendly", included: ["Breakfast", "WiFi"], bedType: "Mixed beds", bathroomInfo: "Private bathroom", maxGuests: "4" } },
    { label: "Private Villa", patch: { title: "Private Villa", ctaLabel: "Book this room", highlight: "Private", included: ["Breakfast", "Pool access", "WiFi"], bedType: "King bed", bathroomInfo: "Ensuite bathroom", maxGuests: "2" } },
    { label: "Dorm Bed", patch: { title: "Dorm Bed", ctaLabel: "Check availability", highlight: "Best value", included: ["WiFi", "Shared bathroom"], bedType: "Bunk beds", bathroomInfo: "Shared bathroom", maxGuests: "1" } },
  ],
  package: [
    { label: "Starter Bundle", patch: { title: "Starter Bundle", ctaLabel: "Ask about this package", highlight: "Best value", included: ["Service", "Consultation"] } },
    { label: "Weekend Promo", patch: { title: "Weekend Promo", ctaLabel: "Request package", highlight: "Limited offer", included: ["Service", "Product"] } },
    { label: "Tour Package", patch: { title: "Tour Package", ctaLabel: "Contact via WhatsApp", highlight: "Popular", duration: "Full day", included: ["Transport", "Guide", "Refreshment"] } },
    { label: "Retreat", patch: { title: "Retreat Package", ctaLabel: "Ask about this package", highlight: "New", included: ["Service", "Refreshment"] } },
  ],
  service: [
    { label: "Menu Item", patch: { title: "Signature Menu Item", ctaLabel: "Inquire", highlight: "Popular", included: ["Staff support"] } },
    { label: "Consultation", patch: { title: "Consultation", ctaLabel: "Book via WhatsApp", duration: "30 minutes", included: ["Staff support"] } },
    { label: "Scooter Rental", patch: { title: "Scooter Rental", ctaLabel: "Ask details", duration: "Full day", included: ["Equipment"] } },
    { label: "Island Tour", patch: { title: "Island Tour", ctaLabel: "Book via WhatsApp", duration: "Full day", included: ["Transport", "Guide", "Refreshment"] } },
  ],
};

export const businessCategories: Record<BusinessCategoryId, BusinessCategory> = {
  accommodation: {
    id: "accommodation",
    label: "Resort / Villa / Hotel",
    shortLabel: "Hospitality",
    icon: "HT",
    heroPlaceholder: "Your Private Sanctuary in Paradise",
    offerSectionTitle: "Rooms & Packages",
    offerSectionBody: "Simple comfort, warm details, direct rates",
    servicesLabel: "Rooms, packages, services, or guest experiences, one per line",
    servicesPlaceholder: "Ocean view suite\nBreakfast package\nAirport pickup",
    featurePlaceholder: "Direct WhatsApp booking\nBreakfast included\nAirport pickup available",
    emptyOfferDescription: "Add rooms, packages, guest services, or experiences to preview them here.",
    primaryCta: "Ask availability",
    secondaryCta: "Book via WhatsApp",
    pricingFallback: "Direct rate",
    capacityLabel: "guests",
    pageLabels: ["Home", "Rooms", "Offers", "Contact"],
    sectionLabels: ["Hero & Booking", "About the Property", "Featured Offers", "Reviews", "Location & Contact"],
    landingNav: { offers: "Rooms", experiences: "Services" },
    quickPresets: ["Ocean view rooms", "Breakfast packages", "Airport pickup", "Spa treatments"],
    serviceDraftTitle: "AI suggested rooms, packages & services",
    serviceDraftEmpty: "Add rooms, packages, services, or guest experiences below. They will appear as customer-ready cards on your site.",
    defaultBookingMessage: (businessName) => `Hello, I would like to make a reservation at ${businessName}.
Check-in:
Check-out:
Guests:
Airport Pickup:`,
    inquiry: {
      eyebrow: "Direct booking",
      title: "Check dates on WhatsApp",
      body: "Share your stay details and continue the reservation conversation with the host.",
      namePlaceholder: "Guest name",
      requestLabel: "Special request",
      requestPlaceholder: "Airport pickup, room preference, or special notes",
      preferredTimeLabel: "Preferred arrival time",
      preferredTimePlaceholder: "Afternoon, evening, or flight time",
      submitLabel: "Book on WhatsApp",
      preferredDateLabel: "Check-in",
      sizeLabel: "Guests",
      summaryFallback: "General stay inquiry",
      quickReplies: [
        "Thanks for reaching out. Can you share your preferred check-in and check-out dates?",
        "I can help with that. Would you like room availability or direct rates first?",
        "Here is our current stay offer. Please let us know what works best for you.",
        "We can continue this conversation here and confirm the booking details shortly.",
      ],
    },
    offerSections: defaultOfferSections,
    offerOrder: ["room", "package", "service"],
    ctaOptions: defaultCtaOptions,
    includedOptions: defaultIncludedOptions,
    starterPresets: defaultStarterPresets,
  },
  food: {
    id: "food",
    label: "Cafe / Restaurant",
    shortLabel: "Food & Beverage",
    icon: "CF",
    heroPlaceholder: "Fresh local flavors, ready to reserve",
    offerSectionTitle: "Menu & Offers",
    offerSectionBody: "Menus, set meals, reservations, and catering customers can ask about directly",
    servicesLabel: "Menu highlights, set menus, reservations, or catering, one per line",
    servicesPlaceholder: "Signature tasting menu\nWeekend brunch set\nPrivate catering",
    featurePlaceholder: "Table reservations via WhatsApp\nLocal ingredients\nPrivate catering available",
    emptyOfferDescription: "Add menu items, set menus, reservations, or catering offers to preview them here.",
    primaryCta: "Reserve a table",
    secondaryCta: "Ask menu details",
    pricingFallback: "Ask for menu",
    capacityLabel: "people",
    pageLabels: ["Home", "Menu", "Offers", "Contact"],
    sectionLabels: ["Hero & WhatsApp CTA", "Menu Highlights", "Featured Offers", "Reviews", "Location & Contact"],
    landingNav: { offers: "Menu", experiences: "Catering" },
    quickPresets: ["Menu highlights", "Set menus", "Table reservations", "Catering"],
    serviceDraftTitle: "AI suggested menu items, set menus & offers",
    serviceDraftEmpty: "Add menu highlights, set menus, reservations, or catering offers below. They will appear as customer-ready cards on your site.",
    defaultBookingMessage: (businessName) => `Hello, I would like to inquire about ${businessName}.
Name:
Contact:
Request:
Preferred date or time:
Party size:`,
    inquiry: {
      eyebrow: "Table & menu inquiry",
      title: "Reserve or ask on WhatsApp",
      body: "Share your preferred time, party size, or menu question and continue directly in WhatsApp.",
      namePlaceholder: "Customer name",
      requestLabel: "Menu or reservation request",
      requestPlaceholder: "Table for four, catering, set menu, or takeaway request",
      preferredTimeLabel: "Preferred date or time",
      preferredTimePlaceholder: "Tonight 7pm, this weekend, or a specific date",
      submitLabel: "Reserve on WhatsApp",
      preferredDateLabel: "Preferred date",
      sizeLabel: "Party size",
      summaryFallback: "Food and reservation inquiry",
      quickReplies: [
        "Thanks for reaching out. Can you share your preferred date, time, and party size?",
        "I can help with that. Would you like menu details or reservation availability first?",
        "Here is our current menu offer. Please let us know what works best for you.",
        "We can continue this conversation here and confirm your reservation shortly.",
      ],
    },
    offerSections: {
      ...defaultOfferSections,
      service: { ...defaultOfferSections.service, title: "Menu & Services", description: "Menu highlights, dine-in services, takeaway options, catering, or add-ons.", addLabel: "Add Menu Item", emptyTitle: "No menu items yet" },
      package: { ...defaultOfferSections.package, title: "Set Menus & Packages", description: "Bundled menus, group dining, promos, catering, or seasonal specials.", addLabel: "Add Set Menu", emptyTitle: "No set menus yet" },
    },
    offerOrder: ["service", "package"],
    ctaOptions: {
      ...defaultCtaOptions,
      package: ["Reserve set menu", "Ask catering details", "Contact via WhatsApp"],
      service: ["Reserve a table", "Ask menu details", "Order via WhatsApp"],
    },
    includedOptions: {
      ...defaultIncludedOptions,
      package: ["Food", "Drinks", "Service", "Reservation", "Delivery"],
      service: ["Ingredients", "Service", "Takeaway", "Reservation", "Delivery"],
    },
    starterPresets: {
      ...defaultStarterPresets,
      package: [
        { label: "Set Menu", patch: { title: "Signature Set Menu", ctaLabel: "Reserve set menu", highlight: "Popular", included: ["Food", "Drinks", "Service"] } },
        { label: "Group Dining", patch: { title: "Group Dining Package", ctaLabel: "Ask catering details", highlight: "Groups", included: ["Reservation", "Service"] } },
        { label: "Weekend Promo", patch: { title: "Weekend Promo", ctaLabel: "Contact via WhatsApp", highlight: "Limited offer", included: ["Food", "Drinks"] } },
      ],
      service: [
        { label: "Signature Dish", patch: { title: "Signature Menu Item", ctaLabel: "Ask menu details", highlight: "Popular", included: ["Ingredients"] } },
        { label: "Reservation", patch: { title: "Table Reservation", ctaLabel: "Reserve a table", duration: "Preferred time", included: ["Reservation", "Service"] } },
        { label: "Takeaway", patch: { title: "Takeaway Order", ctaLabel: "Order via WhatsApp", included: ["Takeaway"] } },
      ],
    },
  },
  tour: {
    id: "tour",
    label: "Tour Operator",
    shortLabel: "Tours",
    icon: "TR",
    heroPlaceholder: "Private local tours, planned on WhatsApp",
    offerSectionTitle: "Tours & Packages",
    offerSectionBody: "Trips, itineraries, pickup, and group experiences customers can arrange directly",
    servicesLabel: "Tours, itineraries, pickup, or group packages, one per line",
    servicesPlaceholder: "Half-day island tour\nPrivate airport pickup\nSunrise trekking package",
    featurePlaceholder: "Private local guides\nPickup available\nFlexible group sizes",
    emptyOfferDescription: "Add tours, itineraries, pickup services, or group packages to preview them here.",
    primaryCta: "Ask tour availability",
    secondaryCta: "Plan via WhatsApp",
    pricingFallback: "Ask for tour rate",
    capacityLabel: "people",
    pageLabels: ["Home", "Tours", "Packages", "Contact"],
    sectionLabels: ["Hero & WhatsApp CTA", "Tour Highlights", "Featured Packages", "Reviews", "Pickup & Contact"],
    landingNav: { offers: "Tours", experiences: "Itineraries" },
    quickPresets: ["Tour packages", "Itineraries", "Pickup service", "Group trips"],
    serviceDraftTitle: "AI suggested tours, packages & pickup services",
    serviceDraftEmpty: "Add tours, itineraries, pickup services, or group packages below. They will appear as customer-ready cards on your site.",
    defaultBookingMessage: (businessName) => `Hello, I would like to inquire about ${businessName}.
Name:
Contact:
Tour or package:
Preferred date:
Group size:`,
    inquiry: {
      eyebrow: "Tour inquiry",
      title: "Plan this trip on WhatsApp",
      body: "Share your preferred date, group size, and tour interest so the operator can respond directly.",
      namePlaceholder: "Customer name",
      requestLabel: "Tour request",
      requestPlaceholder: "Tour name, pickup location, group needs, or custom itinerary",
      preferredTimeLabel: "Preferred tour date",
      preferredTimePlaceholder: "Tomorrow, this weekend, or a specific date",
      submitLabel: "Ask tour availability",
      preferredDateLabel: "Preferred date",
      sizeLabel: "Group size",
      summaryFallback: "Tour inquiry",
      quickReplies: [
        "Thanks for reaching out. Can you share your preferred tour date and group size?",
        "I can help with that. Would you like itinerary details or availability first?",
        "Here is our current tour offer. Please let us know what works best for you.",
        "We can continue this conversation here and confirm pickup details shortly.",
      ],
    },
    offerSections: {
      ...defaultOfferSections,
      service: { ...defaultOfferSections.service, title: "Services", description: "Pickup, rentals, guide services, add-ons, or custom trip support.", addLabel: "Add Service" },
      package: { ...defaultOfferSections.package, title: "Tours & Packages", description: "Half-day tours, full-day trips, private itineraries, and group packages.", addLabel: "Add Tour", emptyTitle: "No tours yet" },
    },
    offerOrder: ["package", "service"],
    ctaOptions: {
      ...defaultCtaOptions,
      package: ["Ask tour availability", "Request itinerary", "Plan via WhatsApp"],
      service: ["Ask pickup details", "Book via WhatsApp", "Request quote"],
    },
    includedOptions: {
      ...defaultIncludedOptions,
      package: ["Guide", "Transport", "Pickup", "Tickets", "Refreshment"],
      service: ["Transport", "Guide", "Equipment", "Pickup", "Local support"],
    },
    starterPresets: {
      ...defaultStarterPresets,
      package: [
        { label: "Half-Day Tour", patch: { title: "Half-Day Private Tour", ctaLabel: "Ask tour availability", highlight: "Popular", duration: "Half day", included: ["Guide", "Transport", "Pickup"] } },
        { label: "Full-Day Trip", patch: { title: "Full-Day Island Trip", ctaLabel: "Request itinerary", duration: "Full day", included: ["Guide", "Transport", "Refreshment"] } },
        { label: "Group Tour", patch: { title: "Group Tour Package", ctaLabel: "Plan via WhatsApp", highlight: "Groups", included: ["Guide", "Transport"] } },
      ],
      service: [
        { label: "Airport Pickup", patch: { title: "Airport Pickup", ctaLabel: "Ask pickup details", duration: "One way", included: ["Transport", "Local support"] } },
        { label: "Guide Service", patch: { title: "Private Guide Service", ctaLabel: "Book via WhatsApp", duration: "Flexible", included: ["Guide"] } },
        { label: "Rental", patch: { title: "Equipment Rental", ctaLabel: "Request quote", included: ["Equipment"] } },
      ],
    },
  },
  local_service: {
    id: "local_service",
    label: "Shop / Local Service",
    shortLabel: "Local Service",
    icon: "SH",
    heroPlaceholder: "Local products and services, ready on WhatsApp",
    offerSectionTitle: "Products & Services",
    offerSectionBody: "Products, services, quotes, delivery, and pickup options customers can ask about directly",
    servicesLabel: "Products, services, packages, or consultations, one per line",
    servicesPlaceholder: "Signature product\nService consultation\nDelivery package",
    featurePlaceholder: "Fast WhatsApp replies\nPickup or delivery available\nLocal service team",
    emptyOfferDescription: "Add products, services, packages, or consultations to preview them here.",
    primaryCta: "Request quote",
    secondaryCta: "Ask details",
    pricingFallback: "Ask for pricing",
    capacityLabel: "capacity",
    pageLabels: ["Home", "Products & Services", "Offers", "Contact"],
    sectionLabels: ["Hero & WhatsApp CTA", "Business Details", "Featured Offers", "Reviews", "Location & Contact"],
    landingNav: { offers: "Products", experiences: "Services" },
    quickPresets: ["Products", "Services", "Delivery / pickup", "Consultations"],
    serviceDraftTitle: "AI suggested products, services & packages",
    serviceDraftEmpty: "Add products, services, packages, or consultations below. They will appear as customer-ready cards on your site.",
    defaultBookingMessage: (businessName) => `Hello, I would like to inquire about ${businessName}.
Name:
Contact:
Request:
Preferred date or time:`,
    inquiry: {
      eyebrow: "Customer inquiry",
      title: "Ask this business on WhatsApp",
      body: "Share what you need and continue the conversation directly in WhatsApp.",
      namePlaceholder: "Customer name",
      requestLabel: "Request",
      requestPlaceholder: "Product, service, quantity, delivery, or quote request",
      preferredTimeLabel: "Preferred date or time",
      preferredTimePlaceholder: "Today, this weekend, or a specific time",
      submitLabel: "Inquire on WhatsApp",
      preferredDateLabel: "Preferred date",
      sizeLabel: "Request size",
      summaryFallback: "General customer inquiry",
      quickReplies: [
        "Thanks for reaching out. Can you share your preferred date and request details?",
        "I can help with that. Would you like pricing details or availability first?",
        "Here is our current offer. Please let us know what works best for you.",
        "We can continue this conversation here and confirm the details shortly.",
      ],
    },
    offerSections: defaultOfferSections,
    offerOrder: ["service", "package"],
    ctaOptions: {
      ...defaultCtaOptions,
      package: ["Request quote", "Ask package details", "Contact via WhatsApp"],
      service: ["Request quote", "Ask details", "Order via WhatsApp"],
    },
    includedOptions: {
      ...defaultIncludedOptions,
      package: ["Product", "Service", "Consultation", "Delivery", "Support"],
      service: ["Product", "Materials", "Staff support", "Pickup", "Delivery"],
    },
    starterPresets: defaultStarterPresets,
  },
  wellness: {
    id: "wellness",
    label: "Wellness / Salon",
    shortLabel: "Wellness",
    icon: "WL",
    heroPlaceholder: "Treatments and appointments, booked on WhatsApp",
    offerSectionTitle: "Treatments & Packages",
    offerSectionBody: "Treatments, appointments, packages, and wellness programs customers can book directly",
    servicesLabel: "Treatments, packages, appointments, or wellness programs, one per line",
    servicesPlaceholder: "Signature massage\nHair treatment package\nPrivate wellness consultation",
    featurePlaceholder: "Appointments via WhatsApp\nExperienced team\nTreatment packages available",
    emptyOfferDescription: "Add treatments, packages, appointments, or wellness programs to preview them here.",
    primaryCta: "Book appointment",
    secondaryCta: "Ask treatment details",
    pricingFallback: "Ask for treatment price",
    capacityLabel: "people",
    pageLabels: ["Home", "Treatments", "Packages", "Contact"],
    sectionLabels: ["Hero & WhatsApp CTA", "Treatment Highlights", "Featured Packages", "Reviews", "Location & Contact"],
    landingNav: { offers: "Treatments", experiences: "Packages" },
    quickPresets: ["Treatments", "Wellness packages", "Appointments", "Staff picks"],
    serviceDraftTitle: "AI suggested treatments, packages & appointments",
    serviceDraftEmpty: "Add treatments, packages, appointments, or wellness programs below. They will appear as customer-ready cards on your site.",
    defaultBookingMessage: (businessName) => `Hello, I would like to inquire about ${businessName}.
Name:
Contact:
Treatment:
Preferred date or time:`,
    inquiry: {
      eyebrow: "Appointment inquiry",
      title: "Book this appointment on WhatsApp",
      body: "Share your preferred time, treatment, or consultation request and continue directly in WhatsApp.",
      namePlaceholder: "Customer name",
      requestLabel: "Treatment or appointment request",
      requestPlaceholder: "Treatment, stylist, package, or consultation request",
      preferredTimeLabel: "Preferred appointment time",
      preferredTimePlaceholder: "Today afternoon, this weekend, or a specific time",
      submitLabel: "Book appointment",
      preferredDateLabel: "Preferred date",
      sizeLabel: "People",
      summaryFallback: "Appointment inquiry",
      quickReplies: [
        "Thanks for reaching out. Can you share your preferred appointment date and time?",
        "I can help with that. Would you like treatment details or availability first?",
        "Here is our current treatment offer. Please let us know what works best for you.",
        "We can continue this conversation here and confirm your appointment shortly.",
      ],
    },
    offerSections: {
      ...defaultOfferSections,
      service: { ...defaultOfferSections.service, title: "Treatments", description: "Individual treatments, appointments, consultations, or staff-led services.", addLabel: "Add Treatment", emptyTitle: "No treatments yet" },
      package: { ...defaultOfferSections.package, title: "Packages", description: "Treatment bundles, memberships, wellness programs, and seasonal promos.", addLabel: "Add Package" },
    },
    offerOrder: ["service", "package"],
    ctaOptions: {
      ...defaultCtaOptions,
      package: ["Book package", "Ask treatment details", "Contact via WhatsApp"],
      service: ["Book appointment", "Ask treatment details", "Reserve via WhatsApp"],
    },
    includedOptions: {
      ...defaultIncludedOptions,
      package: ["Treatment", "Consultation", "Products", "Refreshment", "Aftercare"],
      service: ["Treatment", "Consultation", "Products", "Staff support", "Aftercare"],
    },
    starterPresets: {
      ...defaultStarterPresets,
      package: [
        { label: "Treatment Package", patch: { title: "Treatment Package", ctaLabel: "Book package", highlight: "Best value", included: ["Treatment", "Consultation", "Aftercare"] } },
        { label: "Wellness Program", patch: { title: "Wellness Program", ctaLabel: "Ask treatment details", duration: "Custom", included: ["Treatment", "Products"] } },
        { label: "Seasonal Promo", patch: { title: "Seasonal Promo", ctaLabel: "Contact via WhatsApp", highlight: "Limited offer", included: ["Treatment"] } },
      ],
      service: [
        { label: "Massage", patch: { title: "Signature Massage", ctaLabel: "Book appointment", highlight: "Popular", duration: "60 minutes", included: ["Treatment", "Aftercare"] } },
        { label: "Salon Treatment", patch: { title: "Hair Treatment", ctaLabel: "Reserve via WhatsApp", duration: "90 minutes", included: ["Treatment", "Products"] } },
        { label: "Consultation", patch: { title: "Wellness Consultation", ctaLabel: "Ask treatment details", duration: "30 minutes", included: ["Consultation"] } },
      ],
    },
  },
};

export const businessTypeOptions = Object.values(businessCategories).map((category) => category.label);

export function businessCategoryFromType(input: string | BusinessCategoryInput | Pick<Resort, "type" | "template_id"> | null | undefined): BusinessCategory {
  let type = "";
  let templateId = "";

  if (typeof input === "string") {
    type = input;
  } else if (input) {
    type = input.type ?? "";
    templateId = "template_id" in input ? input.template_id ?? "" : input.templateId ?? "";
  }

  const normalizedType = type.toLowerCase();
  const normalizedTemplate = templateId.toLowerCase();
  const typeHas = (words: string[]) => words.some((word) => normalizedType.includes(word));
  const templateHas = (words: string[]) => words.some((word) => normalizedTemplate.includes(word));

  if (typeHas(["resort", "villa", "hotel", "stay", "guesthouse", "homestay", "accommodation"])) {
    return businessCategories.accommodation;
  }

  if (typeHas(["cafe", "restaurant", "warung", "bar", "bakery", "coffee", "dining", "food", "menu"])) {
    return businessCategories.food;
  }

  if (typeHas(["tour", "travel", "trip", "guide", "surf", "diving", "trek", "adventure", "transport", "rental"])) {
    return businessCategories.tour;
  }

  if (typeHas(["wellness", "salon", "spa", "massage", "beauty", "hair", "barber", "yoga", "clinic", "treatment"])) {
    return businessCategories.wellness;
  }

  if (templateHas(["surf-camp"])) {
    return businessCategories.tour;
  }

  if (templateHas(["boutique-villa", "boutique-resort"])) {
    return businessCategories.accommodation;
  }

  return businessCategories.local_service;
}

export function isAccommodationBusiness(input: string | BusinessCategoryInput | Pick<Resort, "type" | "template_id"> | null | undefined) {
  return businessCategoryFromType(input).id === "accommodation";
}

export function offerSectionsForCategory(category: BusinessCategory) {
  return category.offerOrder.map((kind) => ({ kind, ...category.offerSections[kind] }));
}

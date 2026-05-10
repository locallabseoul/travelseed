// Builds a WhatsApp deep link with a prefilled booking message.
export function createWhatsAppBookingUrl(phoneNumber: string, message: string) {
  const normalizedPhoneNumber = phoneNumber.replace(/[^\d]/g, "");
  return `https://wa.me/${normalizedPhoneNumber}?text=${encodeURIComponent(message)}`;
}

// Creates the default direct-booking inquiry used by the template booking sections.
export function createDefaultBookingMessage(resortName: string) {
  return `Hello, I would like to make a reservation at ${resortName}.
Check-in:
Check-out:
Guests:
Airport Pickup:`;
}

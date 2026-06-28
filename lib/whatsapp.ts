// Builds a WhatsApp deep link with a prefilled inquiry message.
export function createWhatsAppBookingUrl(phoneNumber: string, message: string) {
  const normalizedPhoneNumber = phoneNumber.replace(/[^\d]/g, "");
  return `https://wa.me/${normalizedPhoneNumber}?text=${encodeURIComponent(message)}`;
}

// Creates the default inquiry used by public WhatsApp sections.
export function createDefaultBookingMessage(resortName: string) {
  return `Hello, I would like to inquire about ${resortName}.
Name:
Contact:
Request:
Preferred date or time:`;
}

import { createWhatsAppBookingUrl } from "@/lib/whatsapp";

export function voucherPublicPath(resortSlug: string, publicToken: string) {
  return `/${resortSlug}/vouchers/${publicToken}`;
}

export function createVoucherWhatsAppMessage(resortName: string, voucherUrl: string) {
  return `Hi, ${resortName}. I received my booking voucher: ${voucherUrl}`;
}

export function createVoucherWhatsAppUrl(phoneNumber: string, resortName: string, voucherUrl: string) {
  return createWhatsAppBookingUrl(phoneNumber, createVoucherWhatsAppMessage(resortName, voucherUrl));
}

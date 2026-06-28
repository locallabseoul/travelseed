import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FooterSection } from "@/components/resort/FooterSection";
import { PageViewTracker } from "@/components/resort/PageViewTracker";
import { ResortNavigation } from "@/components/resort/ResortNavigation";
import { businessCategoryFromType } from "@/lib/business-categories";
import { designTokensFor } from "@/lib/design-settings";
import { getActiveResortBySlug } from "@/lib/tenants";
import { createVoucherWhatsAppUrl } from "@/lib/vouchers";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { ResortBookingVoucher } from "@/types/resort";

type VoucherPageProps = {
  params: Promise<{
    slug: string;
    publicToken: string;
  }>;
};

async function getIssuedVoucher(resortId: string, publicToken: string) {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase
    .from("booking_vouchers")
    .select("*")
    .eq("resort_id", resortId)
    .eq("public_token", publicToken)
    .eq("status", "issued")
    .single();

  if (error) {
    return null;
  }

  return data as ResortBookingVoucher;
}

export async function generateMetadata({ params }: VoucherPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resort = await getActiveResortBySlug(slug);

  return {
    title: resort ? `Confirmation | ${resort.name}` : "Confirmation | Travelseed",
    description: resort ? `Customer confirmation for ${resort.name}.` : "Customer confirmation.",
  };
}

export default async function VoucherPage({ params }: VoucherPageProps) {
  const { slug, publicToken } = await params;
  const resort = await getActiveResortBySlug(slug);

  if (!resort) {
    notFound();
  }

  const voucher = await getIssuedVoucher(resort.id, publicToken);
  if (!voucher) {
    notFound();
  }

  const design = designTokensFor(resort.design_settings);
  const category = businessCategoryFromType({ type: resort.type, templateId: resort.template_id });
  const accommodation = category.id === "accommodation";
  const publicUrl = `/${resort.slug}/vouchers/${voucher.public_token}`;
  const whatsappUrl = createVoucherWhatsAppUrl(resort.whatsapp_number, resort.name, publicUrl);

  return (
    <main className="min-h-screen" style={{ backgroundColor: design.colors.page, color: design.colors.text }}>
      <PageViewTracker resortId={resort.id} path={publicUrl} />
      <ResortNavigation resort={resort} variant="dark" />
      <section className="px-5 py-10 sm:px-6 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: design.colors.accent }}>{accommodation ? "Booking voucher" : "Customer confirmation"}</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{accommodation ? "Your stay is confirmed" : "Your request is confirmed"}</h1>
            <p className="mt-4 max-w-xl text-base leading-7 opacity-75">
              {accommodation
                ? "Please keep this confirmation available for check-in. Contact the business if any booking details need to change."
                : "Please keep this confirmation available and continue with the business on WhatsApp if any details need to change."}
            </p>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className={`mt-7 inline-flex min-h-12 items-center px-6 text-sm font-semibold transition ${design.buttonClassName}`} style={{ backgroundColor: design.colors.primary, color: design.colors.buttonText }}>
              Contact on WhatsApp
            </a>
          </div>

          <article className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_24px_90px_rgba(30,25,18,0.12)]">
            <div className="p-6 sm:p-8" style={{ backgroundColor: design.colors.primary, color: design.colors.buttonText }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] opacity-70">{accommodation ? "Voucher" : "Confirmation"}</p>
                  <h2 className="mt-2 text-3xl font-semibold">{voucher.voucher_code}</h2>
                </div>
                <div className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold">Issued</div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a7560]">{accommodation ? "Guest" : "Customer"}</p>
                <p className="mt-2 text-2xl font-semibold text-[#18352f]">{voucher.guest_name}</p>
                {voucher.guest_contact ? <p className="mt-1 text-sm text-[#6f7b74]">{voucher.guest_contact}</p> : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <DetailCard label={category.inquiry.preferredDateLabel} value={formatDate(voucher.check_in)} />
                {accommodation ? <DetailCard label="Check-out" value={formatDate(voucher.check_out)} /> : null}
                <DetailCard label={category.inquiry.sizeLabel} value={voucher.guests ? String(voucher.guests) : "TBC"} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailCard label="Offer" value={voucher.offer_title || "Customer inquiry"} />
                {accommodation ? <DetailCard label="Room" value={voucher.room_label || "Assigned by business"} /> : null}
              </div>

              {voucher.amount_note ? <TextBlock label="Amount" value={voucher.amount_note} /> : null}
              {voucher.included_notes ? <TextBlock label="Included" value={voucher.included_notes} /> : null}
              {voucher.policy_notes ? <TextBlock label="Policy notes" value={voucher.policy_notes} /> : null}

              <div className="rounded-2xl bg-[#fbfaf7] p-4 text-sm leading-6 text-[#52615a]">
                <p className="font-semibold text-[#18352f]">{resort.name}</p>
                <p>{resort.location}</p>
                <p className="mt-2">Issued {formatDateTime(voucher.issued_at)}</p>
              </div>
            </div>
          </article>
        </div>
      </section>
      <FooterSection resort={resort} />
    </main>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf7] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a7560]">{label}</p>
      <p className="mt-2 text-base font-semibold text-[#18352f]">{value}</p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a7560]">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#52615a]">{value}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "TBC";
  }

  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "after business confirmation";
  }

  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

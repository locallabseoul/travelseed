import type { Resort } from "@/types/resort";

type FooterSectionProps = {
  resort: Resort;
};

// Keeps tenant identity visible at the end of every generated website.
export function FooterSection({ resort }: FooterSectionProps) {
  return (
    <footer className="bg-[#11241f] px-5 py-10 text-white sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">{resort.name}</p>
          <p className="text-sm text-white/70">{resort.location}</p>
        </div>
        <p className="text-sm text-white/55">Direct booking website powered by Travelseed</p>
      </div>
    </footer>
  );
}

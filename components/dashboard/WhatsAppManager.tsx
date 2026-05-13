import { mockResort } from "@/components/dashboard/mockData";
import { Field, Panel, PrimaryButton } from "@/components/dashboard/ui";

const bookingTemplate = `Hello, I would like to make a reservation at Villa Jeruk.
Check-in:
Check-out:
Guests:
Airport Pickup:`;

export function WhatsAppManager() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
      <Panel>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#72815e]">WhatsApp</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#18352f]">Booking settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f7b74]">Configure the guided WhatsApp message that guests send from the direct booking site.</p>
        <div className="mt-6 grid gap-5">
          <Field label="WhatsApp Number" value={mockResort.whatsappNumber} />
          <Field label="Default Message" value="Hello, I would like to book Villa Jeruk." />
          <Field label="Booking Message Template" value={bookingTemplate} textarea />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Language" value="English" />
            <Field label="Airport Pickup Option" value="Enabled" />
          </div>
          <PrimaryButton>Save WhatsApp settings</PrimaryButton>
        </div>
      </Panel>

      <Panel>
        <h2 className="text-xl font-semibold text-[#18352f]">Chat preview</h2>
        <div className="mt-5 rounded-[2rem] bg-[#e8f0e6] p-4">
          <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#e8eee6] pb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2d6b50] text-sm font-bold text-white">VJ</span>
              <div>
                <p className="text-sm font-semibold text-[#18352f]">Villa Jeruk</p>
                <p className="text-xs text-[#6f7b74]">Typically replies in minutes</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-[#f0f4ef] p-3 text-sm leading-6 text-[#18352f]">
                Hello, I would like to make a reservation at Villa Jeruk.
                <br />Check-in:
                <br />Check-out:
                <br />Guests:
                <br />Airport Pickup:
              </div>
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-[#2d6b50] p-3 text-sm text-white">
                Thanks. Please send your dates and guest count.
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

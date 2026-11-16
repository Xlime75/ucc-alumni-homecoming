import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import RegistrationForm from "./registration-form";

export const instant = false;

export default async function RegisterPage() {
  await connectDB();

  const event = await Event.findOne({
    eventName: "Alumni Homecoming 2027",
  });

  if (!event) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F8F1DF] p-6">
        <p className="text-[#10264C]">
          Event information is currently unavailable.
        </p>
      </main>
    );
  }

  const eventDate = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(event.date);

  return (
    <main className="min-h-screen bg-[#F8F1DF] px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D6A84B]">
            Unida Christian Colleges
          </p>

          <h1 className="mt-3 font-serif text-4xl font-bold text-[#064B36] sm:text-5xl">
            Alumni Homecoming 2027
          </h1>

          <p className="mt-3 text-[#10264C]">
            {event.theme}
          </p>

          <p className="mt-2 text-sm text-gray-600">
            {eventDate} · {event.venue}
          </p>
        </div>

        {!event.registrationOpen && (
          <div className="mb-6 rounded-xl border border-[#D6A84B] bg-white p-5 text-center">
            <h2 className="font-semibold text-[#10264C]">
              Registration is currently closed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You can preview the registration form, but submissions
              are not yet being accepted.
            </p>
          </div>
        )}

        <RegistrationForm
          feePerPerson={event.feePerPerson}
          registrationOpen={event.registrationOpen}
        />
      </div>
    </main>
  );
}

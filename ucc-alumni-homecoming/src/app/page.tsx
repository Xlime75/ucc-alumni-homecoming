
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Users,
  QrCode,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Reconnect and Celebrate",
    description:
      "Gather with former classmates, teachers, staff, and friends to celebrate the memories that unite us.",
  },
  {
    icon: CalendarDays,
    title: "A Special Homecoming",
    description:
      "Join us on January 30, 2027, for a meaningful celebration of faith, friendship, and shared memories.",
  },
  {
    icon: QrCode,
    title: "Easy Registration and Check-in",
    description:
      "Register online, monitor your payment, and enjoy a convenient QR-based event attendance process.",
  },
];

export default function HomePage() {
  return (
    <main className="bg-[#F8F1DF] text-[#253328]">

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#064B36] text-[#F8E5B0]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A6848] via-[#064B36] to-[#02291F]" />

        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#D6A84B]/10 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#D6A84B]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center md:py-32">

          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#E7C77D]">
            Unida Christian Colleges
          </p>

          <div className="mx-auto my-7 h-px max-w-xs bg-gradient-to-r from-transparent via-[#D6A84B] to-transparent" />

          <h1 className="font-serif text-5xl font-bold tracking-wide md:text-7xl">
            UNIDA
          </h1>

          <p className="mt-5 font-serif text-2xl italic text-[#F5DFA8] md:text-4xl">
            Uniting Chapters through Christ
          </p>

          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#E7C77D] md:text-base">
            One Faith. One Pag-Ibig. One Unida!
          </p>

          <div className="mx-auto my-10 h-px max-w-2xl bg-gradient-to-r from-transparent via-[#D6A84B] to-transparent" />

          <div className="flex flex-wrap justify-center gap-4">
            <div className="rounded-full bg-gradient-to-r from-[#F6D47F] to-[#C99A3C] px-7 py-3 font-serif font-bold text-[#30220C] shadow-lg">
              JANUARY 30, 2027
            </div>

            <div className="rounded-full bg-gradient-to-r from-[#F6D47F] to-[#C99A3C] px-7 py-3 font-serif font-bold text-[#30220C] shadow-lg">
              UCC GYMNASIUM
            </div>
          </div>

          <h2 className="mt-12 font-serif text-2xl font-semibold tracking-widest text-[#F5DFA8] md:text-4xl">
            ALUMNI HOMECOMING 2027
          </h2>

          <p className="mt-5 text-sm text-[#EADDBD]">
            A celebration of faith, friendship, and generations of memories.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-[#D6A84B] px-7 py-3 font-semibold text-[#172B20] transition hover:bg-[#EBC66F]"
            >
              Register Now
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/check-in"
              className="rounded-lg border border-[#E7C77D] px-7 py-3 font-semibold text-[#F8E5B0] transition hover:bg-white/10"
            >
              Event Check-in
            </Link>
          </div>
        </div>
      </section>

      {/* EVENT INFORMATION */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#9A762F]">
            Save the Date
          </p>

          <h2 className="mt-4 font-serif text-3xl font-bold text-[#173D2B] md:text-4xl">
            A Homecoming to Remember
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-8 text-[#596458]">
            From different chapters and generations, we come together
            once again as one Unida family. Let us celebrate the
            friendships, faith, and memories that connect us.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#D6C69F] bg-white p-8 text-center shadow-sm">
            <CalendarDays className="mx-auto text-[#A47A29]" size={32} />
            <h3 className="mt-4 font-serif text-xl font-bold text-[#173D2B]">
              Event Date
            </h3>
            <p className="mt-2 text-[#596458]">
              January 30, 2027
            </p>
          </div>

          <div className="rounded-2xl border border-[#D6C69F] bg-white p-8 text-center shadow-sm">
            <MapPin className="mx-auto text-[#A47A29]" size={32} />
            <h3 className="mt-4 font-serif text-xl font-bold text-[#173D2B]">
              Event Venue
            </h3>
            <p className="mt-2 text-[#596458]">
              UCC Gymnasium
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-[#EEE5D0] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#9A762F]">
              Welcome Home
            </p>

            <h2 className="mt-3 font-serif text-3xl font-bold text-[#173D2B]">
              Reconnect. Remember. Celebrate.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-[#D6C69F] bg-[#FFFCF5] p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="inline-flex rounded-xl bg-[#E9E0C9] p-3 text-[#876323]">
                    <Icon size={27} />
                  </div>

                  <h3 className="mt-5 font-serif text-xl font-bold text-[#173D2B]">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#596458]">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* REGISTRATION CTA */}
      <section className="bg-[#064B36] px-6 py-20 text-center text-[#F8E5B0]">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D6A84B]">
            One Faith. One Pag-Ibig. One Unida!
          </p>

          <h2 className="mt-5 font-serif text-3xl font-bold md:text-4xl">
            Your Chapter. Your Memories. Your Homecoming.
          </h2>

          <p className="mt-5 leading-7 text-[#E5DCC5]">
            Be part of this special gathering. Register for the
            Unida Christian Colleges Alumni Homecoming 2027.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#D6A84B] px-8 py-3 font-semibold text-[#172B20] transition hover:bg-[#EBC66F]"
          >
            Register for Homecoming
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </main>
  );
}


import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#D6A84B]/30 bg-[#10264C] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white">
            <Image
              src="/alumni-association-04.png"
              alt="Unida Christian Colleges Alumni Association logo"
              fill
              sizes="48px"
              className="object-cover object-top"
            />
          </div>

          <div>
            <p className="font-bold text-white">
              UCC Alumni Homecoming
            </p>
            <p className="text-xs text-white/70">
              Unida Christian Colleges
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-slate-600 hover:text-blue-900">
            Home
          </Link>

          <Link
            href="/register"
            className="text-slate-600 hover:text-blue-900"
          >
            Register
          </Link>

          <Link
            href="/check-in"
           className="rounded-lg bg-[#D6A84B] px-4 py-2 text-[#172B20] transition hover:bg-[#EBC66F]"
          >
            Check In
          </Link>
        </div>
      </nav>
    </header>
  );
}

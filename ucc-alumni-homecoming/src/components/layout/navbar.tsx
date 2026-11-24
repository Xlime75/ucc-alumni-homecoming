
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#D6A84B]/30 bg-[#10264C] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" onClick={closeMenu} className="flex items-center gap-3">
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

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/" className="text-white/80 transition hover:text-[#D6A84B]">
            Home
          </Link>

          <Link href="/register" className="text-white/80 transition hover:text-[#D6A84B]">
            Register
          </Link>

          <Link
            href="/payment"
            className="rounded-lg border border-[#D6A84B] px-4 py-2 text-[#EBC66F] transition hover:bg-[#D6A84B] hover:text-[#172B20]"
          >
            Payment Portal
          </Link>

          <Link
            href="/check-in"
            className="rounded-lg bg-[#D6A84B] px-4 py-2 text-[#172B20] transition hover:bg-[#EBC66F]"
          >
            Check In
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg border border-white/30 px-4 py-2 text-sm font-medium text-white md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="border-t border-white/10 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium">
            <Link
              href="/"
              onClick={closeMenu}
              className="rounded-lg px-3 py-3 text-white/90 transition hover:bg-white/10"
            >
              Home
            </Link>

            <Link
              href="/register"
              onClick={closeMenu}
              className="rounded-lg px-3 py-3 text-white/90 transition hover:bg-white/10"
            >
              Register
            </Link>

            <Link
              href="/payment"
              onClick={closeMenu}
              className="rounded-lg border border-[#D6A84B] px-3 py-3 font-semibold text-[#EBC66F] transition hover:bg-[#D6A84B] hover:text-[#172B20]"
            >
              Payment Portal
            </Link>

            <Link
              href="/check-in"
              onClick={closeMenu}
              className="rounded-lg bg-[#D6A84B] px-3 py-3 text-center font-semibold text-[#172B20] transition hover:bg-[#EBC66F]"
            >
              Check In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

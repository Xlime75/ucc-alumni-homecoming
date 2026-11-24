
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ClipboardCheck,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Registrations",
    href: "/admin/registrations",
    icon: Users,
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    name: "Attendance",
    href: "/admin/attendance",
    icon: ClipboardCheck,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-full flex-col bg-[#064B36] text-white md:w-64">
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-3">
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
            <h2 className="font-bold">UCC Alumni Homecoming</h2>
            <p className="text-xs text-white/60">
              Admin Panel · 2027
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-white/50">
          Main Menu
        </p>

        {navigation.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-[#D6A84B] text-[#10264C]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-white/80 transition hover:bg-red-500/20 hover:text-white"
        >
          <LogOut size={19} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}


"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  CreditCard,
  Clock,
  Wallet,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

type Statistics = {
  totalRegistrations: number;
  totalAttendees: number;
  confirmedRegistrations: number;
  confirmedPayments: number;
  pendingPayments: number;
  expectedCollection: number;
};

type RecentRegistration = {
  _id: string;
  registrationNumber: string;
  primaryRegistrant: {
    fullName: string;
    email: string;
  };
  totalAttendees: number;
  totalAmount: number;
  registrationStatus: string;
  paymentStatus: string;
  registeredAt: string;
};

export default function AdminDashboard() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [recentRegistrations, setRecentRegistrations] = useState<
    RecentRegistration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load dashboard."
        );
      }

      setStatistics(data.statistics);
      setRecentRegistrations(data.recentRegistrations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      try {
        const response = await fetch("/api/admin/stats");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load dashboard."
          );
        }

        if (active) {
          setStatistics(data.statistics);
          setRecentRegistrations(data.recentRegistrations);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      active = false;
    };
  }, []);

  const formatCurrency = (amount: number) =>
    `₱${amount.toLocaleString("en-PH")}`;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-PH", {
      dateStyle: "medium",
    });

  const formatLabel = (value: string) =>
    value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const statusStyle = (value: string) => {
    switch (value) {
      case "paid":
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
      case "refunded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const cards = [
    {
      title: "Total Registrations",
      value: statistics?.totalRegistrations ?? 0,
      icon: Users,
      description: "All submitted registrations",
    },
    {
      title: "Total Attendees",
      value: statistics?.totalAttendees ?? 0,
      icon: UserCheck,
      description: "Including companions",
    },
    {
      title: "Confirmed Registrations",
      value: statistics?.confirmedRegistrations ?? 0,
      icon: CreditCard,
      description: "Successfully confirmed",
    },
    {
      title: "Verified Payments",
      value: statistics?.confirmedPayments ?? 0,
      icon: Wallet,
      description: "Verified or paid onsite",
    },
    {
      title: "Pending Payments",
      value: statistics?.pendingPayments ?? 0,
      icon: Clock,
      description: "Awaiting verification",
    },
    {
      title: "Expected Collection",
      value: formatCurrency(statistics?.expectedCollection ?? 0),
      icon: Wallet,
      description: "Non-cancelled registration totals",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-700">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            UCC Alumni Homecoming 2027 overview.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh Statistics
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>
                <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                  <Icon size={21} />
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold text-gray-900">
                {loading ? "..." : card.value}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Recent Registrations
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Latest submitted registrations.
            </p>
          </div>

          <Link
            href="/admin/registrations"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">Registrant</th>
                <th className="px-5 py-4">Registration No.</th>
                <th className="px-5 py-4">Attendees</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Payment Status</th>
                <th className="px-5 py-4">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    Loading registrations...
                  </td>
                </tr>
              ) : recentRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No registrations yet.
                  </td>
                </tr>
              ) : (
                recentRegistrations.map((registration) => (
                  <tr key={registration._id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {registration.primaryRegistrant.fullName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {registration.primaryRegistrant.email}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-medium text-emerald-800">
                      {registration.registrationNumber}
                    </td>

                    <td className="px-5 py-4">
                      {registration.totalAttendees}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {formatCurrency(registration.totalAmount)}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(registration.paymentStatus)}`}>
                        {formatLabel(registration.paymentStatus)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                      {formatDate(registration.registeredAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

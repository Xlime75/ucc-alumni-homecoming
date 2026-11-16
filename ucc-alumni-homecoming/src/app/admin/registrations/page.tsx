
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Users,
  ChevronDown,
  Eye,
  X,
  ArrowLeft,
} from "lucide-react";

type Registration = {
  _id: string;
  registrationNumber: string;
  primaryRegistrant: {
    fullName: string;
    email: string;
    contactNumber: string;
    attendeeType: string;
  };
  totalAttendees: number;
  totalAmount: number;
  feePerPerson: number;
  registrationStatus: string;
  paymentStatus: string;
  registeredAt: string;
};

type Attendee = {
  _id: string;
  fullName: string;
  email?: string;
  attendeeType: string;
  isPrimaryRegistrant: boolean;
  attendanceStatus: string;
};

type Payment = {
  _id: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  paymentStatus: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
};

type RegistrationDetails = {
  registration: Registration;
  attendees: Attendee[];
  payments: Payment[];
};

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const loadRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        search,
        status,
        paymentStatus,
      });

      const response = await fetch(
        `/api/admin/registrations?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load registrations."
        );
      }

      setRegistrations(data.registrations);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, paymentStatus]);

  useEffect(() => {
    let isActive = true;

    async function fetchRegistrations() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          search,
          status,
          paymentStatus,
        });

        const response = await fetch(
          `/api/admin/registrations?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load registrations."
          );
        }

        if (isActive) {
          setRegistrations(data.registrations);
        }
      } catch (err) {
        if (isActive) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchRegistrations();

    return () => {
      isActive = false;
    };
  }, [search, status, paymentStatus]);

  const viewDetails = async (registrationId: string) => {
    try {
      setDetailsLoading(true);
      setDetailsError("");
      setSelectedRegistration(null);

      const response = await fetch(
        `/api/admin/registrations/${registrationId}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load registration details."
        );
      }

      setSelectedRegistration({
        registration: data.registration,
        attendees: data.attendees,
        payments: data.payments,
      });
    } catch (err) {
      setDetailsError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatLabel = (value: string) => {
    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatCurrency = (amount: number) =>
    `₱${amount.toLocaleString("en-PH")}`;

  const statusStyle = (value: string) => {
    switch (value) {
      case "paid":
      case "confirmed":
      case "verified":
      case "paid_onsite":
        return "bg-green-100 text-green-800";
      case "pending":
      case "pending_verification":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
      case "refunded":
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (selectedRegistration) {
    const { registration, attendees, payments } = selectedRegistration;

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedRegistration(null)}
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800 hover:text-emerald-950"
        >
          <ArrowLeft size={17} />
          Back to Registrations
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-emerald-700">
              Registration Details
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {registration.primaryRegistrant.fullName}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {registration.registrationNumber}
            </p>
          </div>

          <button
            onClick={() => setSelectedRegistration(null)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <X size={16} />
            Close Details
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Total Attendees</p>
            <p className="mt-2 text-2xl font-bold">
              {registration.totalAttendees}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="mt-2 text-2xl font-bold">
              {formatCurrency(registration.totalAmount)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Registration Status</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusStyle(registration.registrationStatus)}`}>
              {formatLabel(registration.registrationStatus)}
            </span>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-gray-500">Payment Status</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusStyle(registration.paymentStatus)}`}>
              {formatLabel(registration.paymentStatus)}
            </span>
          </div>
        </div>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Primary Registrant
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="mt-1 font-medium">
                {registration.primaryRegistrant.fullName}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="mt-1 font-medium">
                {registration.primaryRegistrant.email}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Contact Number</p>
              <p className="mt-1 font-medium">
                {registration.primaryRegistrant.contactNumber}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Attendee Type</p>
              <p className="mt-1 font-medium">
                {formatLabel(registration.primaryRegistrant.attendeeType)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Registration Date</p>
              <p className="mt-1 font-medium">
                {formatDate(registration.registeredAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Fee Per Person</p>
              <p className="mt-1 font-medium">
                {formatCurrency(registration.feePerPerson)}
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-lg font-bold text-gray-900">
              Attendees ({attendees.length})
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Primary registrant and companions included in this registration.
            </p>
          </div>

          {attendees.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">
              No attendee records found.
            </p>
          ) : (
            <div className="divide-y">
              {attendees.map((attendee, index) => (
                <div
                  key={attendee._id}
                  className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {index + 1}. {attendee.fullName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatLabel(attendee.attendeeType)}
                      {attendee.isPrimaryRegistrant
                        ? " • Primary Registrant"
                        : " • Companion"}
                    </p>
                    {attendee.email && (
                      <p className="mt-1 text-xs text-gray-500">
                        {attendee.email}
                      </p>
                    )}
                  </div>

                  <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {formatLabel(attendee.attendanceStatus)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-lg font-bold text-gray-900">
              Payment History ({payments.length})
            </h2>
          </div>

          {payments.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">
              No payment records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td className="px-5 py-4">
                        {formatLabel(payment.paymentMethod)}
                      </td>
                      <td className="px-5 py-4">
                        {payment.referenceNumber || "—"}
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(payment.paymentStatus)}`}>
                          {formatLabel(payment.paymentStatus)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-700">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Registrations
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            View and manage Alumni Homecoming 2027 registrations.
          </p>
        </div>

        <button
          onClick={loadRegistrations}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search name, email, or registration number..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div className="relative">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-emerald-700 lg:w-48"
            >
              <option value="all">All Registration Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="relative">
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-emerald-700 lg:w-48"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overpaid">Overpaid</option>
              <option value="refunded">Refunded</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
          <Users size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500">
            Matching Registrations
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {registrations.length}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {detailsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {detailsError}
        </div>
      )}

      {detailsLoading && (
        <div className="rounded-lg border bg-white p-6 text-center text-sm text-gray-500">
          Loading registration details...
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-4">Registrant</th>
                <th className="px-5 py-4">Registration No.</th>
                <th className="px-5 py-4">Attendees</th>
                <th className="px-5 py-4">Total Amount</th>
                <th className="px-5 py-4">Registration</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Date Registered</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    Loading registrations...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                registrations.map((registration) => (
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
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(registration.registrationStatus)}`}>
                        {formatLabel(registration.registrationStatus)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(registration.paymentStatus)}`}>
                        {formatLabel(registration.paymentStatus)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                      {formatDate(registration.registeredAt)}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => viewDetails(registration._id)}
                        disabled={detailsLoading}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

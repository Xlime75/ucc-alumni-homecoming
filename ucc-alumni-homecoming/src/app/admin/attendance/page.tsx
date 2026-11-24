
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Users,
  CheckCircle,
  Clock,
  ClipboardCheck,
  UserCheck,
  AlertCircle,
} from "lucide-react";

type AttendeeType =
  | "alumni"
  | "former_teacher"
  | "former_staff"
  | "former_principal"
  | "companion";

type AttendanceRecord = {
  _id: string;
  fullName: string;
  attendeeType: AttendeeType;
  isPrimaryRegistrant: boolean;
  registrationNumber: string;
  registrationStatus: string;
  paymentStatus: string;
  totalAmount: number;
  attendanceStatus: "checked_in" | "not_checked_in";
  checkedIn: boolean;
  checkedInAt: string | null;
  checkInMethod: "qr_code" | "manual" | null;
  checkedInBy: string | null;
};

type AttendanceResponse = {
  success: boolean;
  total: number;
  checkedInCount: number;
  notCheckedInCount: number;
  attendees: AttendanceRecord[];
  message?: string;
};

const attendeeTypeLabels: Record<AttendeeType, string> = {
  alumni: "Alumni",
  former_teacher: "Former Teacher",
  former_staff: "Former Staff",
  former_principal: "Former Principal",
  companion: "Companion",
};

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default function AdminAttendancePage() {
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [notCheckedInCount, setNotCheckedInCount] = useState(0);

  const [search, setSearch] = useState("");
  const [attendeeType, setAttendeeType] = useState("all");
  const [attendanceStatus, setAttendanceStatus] = useState("all");
  const [registrationStatus, setRegistrationStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkingInAttendee, setCheckingInAttendee] = useState<string | null>(
    null
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [checkInError, setCheckInError] = useState("");

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        search,
        attendeeType,
        attendanceStatus,
        registrationStatus,
        paymentStatus,
      });

      const response = await fetch(
        `/api/admin/attendance?${params.toString()}`,
        { cache: "no-store" }
      );

      const data: AttendanceResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load attendance records."
        );
      }

      setAttendees(data.attendees);
      setTotal(data.total);
      setCheckedInCount(data.checkedInCount);
      setNotCheckedInCount(data.notCheckedInCount);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [
    search,
    attendeeType,
    attendanceStatus,
    registrationStatus,
    paymentStatus,
  ]);

  useEffect(() => {
    let isActive = true;

    async function fetchAttendance() {
      try {
        const params = new URLSearchParams({
          search,
          attendeeType,
          attendanceStatus,
          registrationStatus,
          paymentStatus,
        });

        const response = await fetch(
          `/api/admin/attendance?${params.toString()}`,
          { cache: "no-store" }
        );

        const data: AttendanceResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load attendance records."
          );
        }

        if (isActive) {
          setAttendees(data.attendees);
          setTotal(data.total);
          setCheckedInCount(data.checkedInCount);
          setNotCheckedInCount(data.notCheckedInCount);
          setError("");
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

    void fetchAttendance();

    return () => {
      isActive = false;
    };
  }, [
    search,
    attendeeType,
    attendanceStatus,
    registrationStatus,
    paymentStatus,
  ]);

  const handleManualCheckIn = async (attendee: AttendanceRecord) => {
    if (attendee.checkedIn) return;

    if (
      attendee.registrationStatus !== "confirmed" ||
      attendee.paymentStatus !== "paid"
    ) {
      setCheckInError(
        "This attendee is not eligible for check-in. The registration must be confirmed and fully paid."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to manually check in ${attendee.fullName}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setCheckingInAttendee(attendee._id);
      setCheckInError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/admin/attendees/${attendee._id}/check-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to check in attendee."
        );
      }

      setSuccessMessage(
        `${attendee.fullName} was successfully checked in.`
      );

      await loadAttendance();
    } catch (err) {
      setCheckInError(
        err instanceof Error
          ? err.message
          : "Unable to complete check-in."
      );
    } finally {
      setCheckingInAttendee(null);
    }
  };

  const attendanceRate =
    total > 0
      ? ((checkedInCount / total) * 100).toFixed(1)
      : "0.0";

  const canCheckIn = (attendee: AttendanceRecord) =>
    attendee.registrationStatus === "confirmed" &&
    attendee.paymentStatus === "paid" &&
    !attendee.checkedIn;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Attendance Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor attendee check-ins for UCC Alumni Homecoming 2027.
          </p>
        </div>

        <button
          onClick={() => void loadAttendance()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Attendees
              </p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {total}
              </h2>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Checked In
              </p>
              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {checkedInCount}
              </h2>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Not Checked In
              </p>
              <h2 className="mt-2 text-3xl font-bold text-amber-600">
                {notCheckedInCount}
              </h2>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Attendance Rate
              </p>
              <h2 className="mt-2 text-3xl font-bold text-[#064B36]">
                {attendanceRate}%
              </h2>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-[#064B36]">
              <ClipboardCheck size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle size={18} />
          {successMessage}
        </div>
      )}

      {checkInError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {checkInError}
        </div>
      )}

      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900">
            Attendee Records
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Search, filter, and manage attendee attendance.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or registration number..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#064B36] focus:ring-2 focus:ring-[#064B36]/10"
            />
          </div>

          <select
            value={attendeeType}
            onChange={(event) => setAttendeeType(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#064B36]"
          >
            <option value="all">All Attendee Types</option>
            <option value="alumni">Alumni</option>
            <option value="former_teacher">Former Teacher</option>
            <option value="former_staff">Former Staff</option>
            <option value="former_principal">Former Principal</option>
            <option value="companion">Companion</option>
          </select>

          <select
            value={attendanceStatus}
            onChange={(event) => setAttendanceStatus(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#064B36]"
          >
            <option value="all">All Attendance Statuses</option>
            <option value="checked_in">Checked In</option>
            <option value="not_checked_in">Not Checked In</option>
          </select>

          <select
            value={registrationStatus}
            onChange={(event) => setRegistrationStatus(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#064B36]"
          >
            <option value="all">All Registration Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#064B36]"
          >
            <option value="all">All Payment Statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overpaid">Overpaid</option>
            <option value="refunded">Refunded</option>
          </select>

          <button
            onClick={() => {
              setSearch("");
              setAttendeeType("all");
              setAttendanceStatus("all");
              setRegistrationStatus("all");
              setPaymentStatus("all");
            }}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
          <span>
            Showing <strong className="text-gray-900">{attendees.length}</strong> attendee records
          </span>
          <span>
            Checked in: <strong className="text-green-600">{checkedInCount}</strong>
          </span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Attendee</th>
                <th className="px-5 py-4 font-semibold">Registration</th>
                <th className="px-5 py-4 font-semibold">Payment</th>
                <th className="px-5 py-4 font-semibold">Attendance</th>
                <th className="px-5 py-4 font-semibold">Check-in Details</th>
                <th className="px-5 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    Loading attendance records...
                  </td>
                </tr>
              ) : attendees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Users size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-700">
                      No attendee records found
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Attendees will appear here once registrations are available.
                    </p>
                  </td>
                </tr>
              ) : (
                attendees.map((attendee) => (
                  <tr key={attendee._id} className="transition hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {attendee.fullName}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {attendeeTypeLabels[attendee.attendeeType]}
                        </span>
                        {attendee.isPrimaryRegistrant && (
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Primary
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">
                        {attendee.registrationNumber}
                      </p>
                      <span className="mt-1 inline-block text-xs capitalize text-gray-500">
                        {formatStatus(attendee.registrationStatus)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          attendee.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {formatStatus(attendee.paymentStatus)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {attendee.checkedIn ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          <CheckCircle size={13} />
                          Checked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          <Clock size={13} />
                          Not Checked In
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {attendee.checkedIn ? (
                        <div>
                          <p className="text-xs text-gray-700">
                            {formatDate(attendee.checkedInAt)}
                          </p>
                          <p className="mt-1 text-xs capitalize text-gray-500">
                            Method: {formatStatus(attendee.checkInMethod || "")}
                          </p>
                          {attendee.checkedInBy && (
                            <p className="mt-1 text-xs text-gray-500">
                              By: {attendee.checkedInBy}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No check-in record
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {attendee.checkedIn ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                          <CheckCircle size={15} />
                          Completed
                        </span>
                      ) : (
                        <button
                          onClick={() => void handleManualCheckIn(attendee)}
                          disabled={
                            checkingInAttendee !== null ||
                            !canCheckIn(attendee)
                          }
                          title={
                            !canCheckIn(attendee)
                              ? "Requires confirmed registration and full payment."
                              : "Manually check in attendee"
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-[#064B36] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#043a2a] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <UserCheck size={15} />
                          {checkingInAttendee === attendee._id
                            ? "Checking In..."
                            : "Check In"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Only confirmed and fully paid registrations are eligible for check-in.
        </p>
        <p>
          Attendance rate: {attendanceRate}%
        </p>
      </div>
    </div>
  );
}

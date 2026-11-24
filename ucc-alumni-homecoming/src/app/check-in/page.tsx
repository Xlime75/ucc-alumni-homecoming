
"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession, signIn, signOut } from "next-auth/react";
import {
  CalendarCheck,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  LogIn,
  LogOut,
  Users,
} from "lucide-react";

interface Attendee {
  id: string;
  fullName: string;
  attendeeType: string;
  isPrimaryRegistrant: boolean;
  checkedIn: boolean;
  checkedInAt: string | null;
}

interface CheckInData {
  registrationNumber: string;
  totalAttendees: number;
  totalAmount: number;
}

interface CheckInResult {
  email: string | null;
  registration: CheckInData | null;
  attendees: Attendee[];
  error: string;
}

// Retrieves the current user's registration and attendance information.
async function fetchCheckInData(): Promise<CheckInResult> {
  const session = await getSession();

  const userEmail = session?.user?.email ?? null;

  if (!userEmail) {
    return {
      email: null,
      registration: null,
      attendees: [],
      error: "",
    };
  }

  const response = await fetch("/api/check-in/me", {
    method: "GET",
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      email: userEmail,
      registration: null,
      attendees: [],
      error: result.message || "Unable to load check-in details.",
    };
  }

  return {
    email: userEmail,
    registration: result.registration,
    attendees: result.attendees || [],
    error: "",
  };
}

export default function CheckInPage() {
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState<string | null>(null);
  const [registration, setRegistration] = useState<CheckInData | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Initial loading.
  // State updates happen after the asynchronous request completes.
  useEffect(() => {
    let isMounted = true;

    async function initializeCheckIn() {
      try {
        const data = await fetchCheckInData();

        if (!isMounted) return;

        setEmail(data.email);
        setRegistration(data.registration);
        setAttendees(data.attendees);
        setError(data.error);
      } catch (err) {
        console.error("Check-in loading error:", err);

        if (isMounted) {
          setError("Unable to connect to the server. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void initializeCheckIn();

    return () => {
      isMounted = false;
    };
  }, []);

  // Reload check-in information when requested.
  const loadCheckIn = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchCheckInData();

      setEmail(data.email);
      setRegistration(data.registration);
      setAttendees(data.attendees);
      setSelectedIds([]);
      setError(data.error);
    } catch (err) {
      console.error("Check-in loading error:", err);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleGoogleLogin() {
    setSigningIn(true);

    try {
      await signIn("google", {
        callbackUrl: "/check-in",
      });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setSigningIn(false);
      setError("Google sign-in failed. Please try again.");
    }
  }

  function toggleAttendee(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  }

  function selectAllAvailable() {
    setSelectedIds(
      attendees
        .filter((attendee) => !attendee.checkedIn)
        .map((attendee) => attendee.id)
    );
  }

  async function handleCheckIn() {
    if (selectedIds.length === 0) {
      setError("Please select at least one attendee.");
      return;
    }

    const selectedNames = attendees
      .filter((attendee) => selectedIds.includes(attendee.id))
      .map((attendee) => attendee.fullName);

    const confirmed = window.confirm(
      `Confirm check-in for the following attendees?\n\n${selectedNames.join(
        "\n"
      )}\n\nAttendance cannot be undone here.`
    );

    if (!confirmed) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/check-in/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendeeIds: selectedIds,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to record attendance.");
        return;
      }

      setSuccess(result.message || "Attendance recorded successfully!");
      setSelectedIds([]);

      await loadCheckIn();
    } catch (err) {
      console.error("Attendance submission error:", err);
      setError("Unable to submit attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const checkedInCount = attendees.filter(
    (attendee) => attendee.checkedIn
  ).length;

  const availableCount = attendees.length - checkedInCount;

  if (loading) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-[#F8F1DF] px-4">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-[#064B36]" />
          <p className="mt-4 text-sm text-gray-600">
            Loading check-in information...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] bg-[#F8F1DF] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#064B36]">
            <CalendarCheck className="h-8 w-8 text-[#D6A84B]" />
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D6A84B]">
            UCC Alumni Homecoming 2027
          </p>

          <h1 className="mt-3 font-serif text-3xl font-bold text-[#064B36] sm:text-4xl">
            Event Check-in
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            One Faith. One Pag-Ibig. One Unida!
          </p>
        </div>

        {!email ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <LogIn className="mx-auto h-10 w-10 text-[#064B36]" />

            <h2 className="mt-4 text-xl font-bold text-[#064B36]">
              Sign in to Check In
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Sign in using the Google account you provided
              during registration to access your attendance details.
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={signingIn}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[#064B36] px-5 py-3 font-semibold text-white transition hover:bg-[#083C2D] disabled:opacity-60"
            >
              {signingIn ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}

              {signingIn ? "Connecting..." : "Continue with Google"}
            </button>
          </div>
        ) : !registration ? (
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="text-center">
              <CircleAlert className="mx-auto h-10 w-10 text-amber-500" />

              <h2 className="mt-4 text-xl font-bold text-[#064B36]">
                Check-in Unavailable
              </h2>

              <p className="mt-3 text-sm text-gray-600">
                {error}
              </p>

              <p className="mt-4 break-all text-xs text-gray-500">
                Signed in as: {email}
              </p>
            </div>

            <button
              onClick={() => void loadCheckIn()}
              className="mt-7 w-full rounded-lg bg-[#064B36] px-5 py-3 font-semibold text-white hover:bg-[#083C2D]"
            >
              Try Again
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/check-in" })}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Registration Number
                  </p>

                  <p className="mt-1 font-bold text-[#064B36]">
                    {registration.registrationNumber}
                  </p>
                </div>

                <CheckCircle2 className="h-8 w-8 text-[#064B36]" />
              </div>

              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="text-xs text-gray-500">
                  Signed in as
                </p>

                <p className="mt-1 break-all text-sm font-medium text-gray-800">
                  {email}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#F8F1DF] p-4">
                  <p className="text-xs text-gray-600">
                    Total Attendees
                  </p>

                  <p className="mt-1 text-2xl font-bold text-[#064B36]">
                    {attendees.length}
                  </p>
                </div>

                <div className="rounded-lg bg-[#F8F1DF] p-4">
                  <p className="text-xs text-gray-600">
                    Checked In
                  </p>

                  <p className="mt-1 text-2xl font-bold text-[#064B36]">
                    {checkedInCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-[#064B36]" />

                <div>
                  <h2 className="font-bold text-[#064B36]">
                    Your Registered Attendees
                  </h2>

                  <p className="text-xs text-gray-500">
                    Select only the people physically present.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  {availableCount} attendee(s) available
                </p>

                <button
                  type="button"
                  onClick={selectAllAvailable}
                  disabled={availableCount === 0}
                  className="text-sm font-semibold text-[#064B36] underline disabled:opacity-40"
                >
                  Select All Available
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {attendees.map((attendee) => (
                  <label
                    key={attendee.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                      attendee.checkedIn
                        ? "cursor-not-allowed border-green-200 bg-green-50"
                        : selectedIds.includes(attendee.id)
                          ? "border-[#064B36] bg-[#F8F1DF]"
                          : "border-gray-200 hover:border-[#064B36]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(attendee.id)}
                      disabled={attendee.checkedIn || submitting}
                      onChange={() => toggleAttendee(attendee.id)}
                      className="h-5 w-5 accent-[#064B36]"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800">
                        {attendee.fullName}
                      </p>

                      <p className="mt-1 text-xs capitalize text-gray-500">
                        {attendee.isPrimaryRegistrant
                          ? "Primary Registrant"
                          : attendee.attendeeType.replace(/_/g, " ")}
                      </p>
                    </div>

                    {attendee.checkedIn ? (
                      <span className="shrink-0 text-xs font-semibold text-green-700">
                        Checked In
                      </span>
                    ) : (
                      <span className="shrink-0 text-xs text-gray-500">
                        Not Checked In
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {error && (
                <div className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    {success}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckIn}
                disabled={selectedIds.length === 0 || submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#064B36] px-5 py-3 font-semibold text-white transition hover:bg-[#083C2D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                )}

                {submitting
                  ? "Recording Attendance..."
                  : `Confirm Check-in (${selectedIds.length})`}
              </button>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/check-in" })}
              className="flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-gray-600 hover:text-[#064B36]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

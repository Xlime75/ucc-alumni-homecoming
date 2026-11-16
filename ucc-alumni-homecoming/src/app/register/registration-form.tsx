
"use client";

import { useState } from "react";

type AttendeeType = "alumni" | "former_teacher" | "former_staff";

interface RegistrationFormProps {
  feePerPerson: number;
  registrationOpen: boolean;
}

interface RegistrationResult {
  success: boolean;
  message: string;
  registration?: {
    registrationNumber: string;
    totalAttendees: number;
    feePerPerson: number;
    totalAmount: number;
    paymentStatus: string;
  };
}

export default function RegistrationForm({
  feePerPerson,
  registrationOpen,
}: RegistrationFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [attendeeType, setAttendeeType] =
    useState<AttendeeType>("alumni");

  const [companions, setCompanions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<RegistrationResult | null>(null);

  const totalAttendees = 1 + companions.length;
  const totalAmount = totalAttendees * feePerPerson;

  function addCompanion() {
  setCompanions((previous) => [...previous, ""]);
}

  function updateCompanion(index: number, value: string) {
    const updated = [...companions];
    updated[index] = value;
    setCompanions(updated);
  }

  function removeCompanion(index: number) {
    setCompanions(companions.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setResult(null);

    if (!registrationOpen) {
      setMessage("Registration is currently closed.");
      return;
    }

    if (companions.some((name) => !name.trim())) {
      setMessage("Please enter the full name of every companion or remove empty entries.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          primaryRegistrant: {
            fullName,
            email,
            contactNumber,
            attendeeType,
          },
          companions: companions.map((name) => ({
            fullName: name.trim(),
          })),
        }),
      });

      const data: RegistrationResult = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Registration failed. Please try again.");
        return;
      }

      setResult(data);
      setMessage(data.message);
    } catch (error) {
      console.error("Registration submission error:", error);
      setMessage("Unable to submit your registration. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (result?.registration) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-bold text-[#064B36]">
            Registration Submitted!
          </h2>
          <p className="mt-3 text-gray-600">{message}</p>
        </div>

        <div className="mt-6 rounded-xl bg-[#F8F1DF] p-5">
          <p className="text-sm text-gray-600">Registration Number</p>
          <p className="mt-1 text-xl font-bold text-[#064B36]">
            {result.registration.registrationNumber}
          </p>

          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total attendees</span>
              <span className="font-semibold">
                {result.registration.totalAttendees}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Fee per person</span>
              <span className="font-semibold">
                ₱{result.registration.feePerPerson.toLocaleString("en-PH")}
              </span>
            </div>
            <div className="flex justify-between border-t border-[#D6A84B]/50 pt-3">
              <span className="font-semibold">Total amount</span>
              <span className="text-xl font-bold text-[#064B36]">
                ₱{result.registration.totalAmount.toLocaleString("en-PH")}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Please save your registration number for future reference.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h2 className="font-serif text-2xl font-bold text-[#064B36]">
          Registration Form
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Please provide your information and the names of your companions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h3 className="mb-4 font-semibold text-[#10264C]">
            Primary Registrant
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#064B36] focus:ring-2 focus:ring-[#064B36]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#064B36] focus:ring-2 focus:ring-[#064B36]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Contact Number
              </label>
              <input
                type="tel"
                required
                minLength={7}
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="09XXXXXXXXX"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#064B36] focus:ring-2 focus:ring-[#064B36]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Attendee Category
              </label>
              <select
                value={attendeeType}
                onChange={(e) =>
                  setAttendeeType(e.target.value as AttendeeType)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#064B36]"
              >
                <option value="alumni">Alumni</option>
                <option value="former_teacher">Former Teacher</option>
                <option value="former_staff">Former Staff</option>
              </select>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[#10264C]">Companions</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add each companion who will attend with you.
              </p>
            </div>

            <button
              type="button"
              onClick={addCompanion}
              className="rounded-lg bg-[#064B36] px-4 py-2 text-sm font-medium text-white hover:bg-[#043b2b]"
            >
              + Add
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {companions.map((companion, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  required
                  minLength={2}
                  value={companion}
                  onChange={(e) => updateCompanion(index, e.target.value)}
                  placeholder={`Companion ${index + 1} full name`}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#064B36]"
                />

                <button
                  type="button"
                  onClick={() => removeCompanion(index)}
                  className="rounded-lg border border-red-200 px-3 text-red-600 hover:bg-red-50"
                  aria-label={`Remove companion ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {companions.length === 0 && (
            <p className="mt-4 text-sm italic text-gray-400">
              No companions added.
            </p>
          )}
        </section>

        <section className="rounded-xl bg-[#F8F1DF] p-5">
          <h3 className="font-semibold text-[#10264C]">
            Registration Summary
          </h3>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total attendees</span>
              <span className="font-semibold">{totalAttendees}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fee per person</span>
              <span className="font-semibold">
                ₱{feePerPerson.toLocaleString("en-PH")}
              </span>
            </div>
            <div className="border-t border-[#D6A84B]/50 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#10264C]">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-[#064B36]">
                  ₱{totalAmount.toLocaleString("en-PH")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <p
            role="status"
            className="rounded-lg bg-[#F8F1DF] p-4 text-sm text-[#10264C]"
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={!registrationOpen || loading}
          className="w-full rounded-lg bg-[#064B36] px-6 py-4 font-semibold text-white transition hover:bg-[#043b2b] disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading
            ? "Submitting..."
            : registrationOpen
              ? "Continue Registration"
              : "Registration Currently Closed"}
        </button>

        <p className="text-center text-xs text-gray-400">
          One Faith. One Pag-Ibig. One Unida!
        </p>
      </form>
    </div>
  );
}

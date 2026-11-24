
"use client";

import { useState } from "react";
import Link from "next/link";

type AttendeeType =
  | "alumni"
  | "former_teacher"
  | "former_staff"
  | "former_principal";

type SchoolLevel =
  | "college"
  | "high_school"
  | "junior_high_school"
  | "senior_high_school"
  | "elementary"
  | "kinder";

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

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#064B36] focus:ring-2 focus:ring-[#064B36]/20";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

function getLocalDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function RegistrationForm({
  feePerPerson,
  registrationOpen,
}: RegistrationFormProps) {
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>("college");
  const [birthday, setBirthday] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [facebookProfile, setFacebookProfile] = useState("");
  const [work, setWork] = useState("");
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
    setCompanions((previous) =>
      previous.map((name, i) => (i === index ? value : name))
    );
  }

  function removeCompanion(index: number) {
    setCompanions((previous) =>
      previous.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setResult(null);

    if (!registrationOpen) {
      setMessage("Registration is currently closed.");
      return;
    }

    if (birthday > getLocalDateString()) {
      setMessage("Birthday cannot be in the future.");
      return;
    }

    const parsedBirthday = new Date(`${birthday}T00:00:00`);

    if (
      !birthday ||
      Number.isNaN(parsedBirthday.getTime()) ||
      parsedBirthday.toISOString().slice(0, 10) !== birthday
    ) {
      setMessage("Please enter a valid birthday.");
      return;
    }

    const phonePattern = /^(09\d{9}|\+639\d{9})$/;

    if (!phonePattern.test(contactNumber.trim())) {
      setMessage(
        "Please enter a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX)."
      );
      return;
    }

    try {
      const facebookUrl = new URL(facebookProfile.trim());

      if (
        facebookUrl.protocol !== "https:" ||
        !(
          facebookUrl.hostname === "facebook.com" ||
          facebookUrl.hostname.endsWith(".facebook.com")
        )
      ) {
        setMessage("Please enter a valid Facebook profile link.");
        return;
      }
    } catch {
      setMessage("Please enter a valid Facebook profile link.");
      return;
    }

    if (companions.some((name) => !name.trim())) {
      setMessage(
        "Please enter the full name of every companion or remove empty entries."
      );
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
            fullName: fullName.trim(),
            nickname: nickname.trim(),
            batchYear: batchYear.trim(),
            schoolLevel,
            birthday,
            currentAddress: currentAddress.trim(),
            contactNumber: contactNumber.trim(),
            email: email.trim(),
            facebookProfile: facebookProfile.trim(),
            work: work.trim(),
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

        <div className="mt-6 space-y-4 text-center">
          <p className="text-sm text-gray-500">
            Please save your registration number for future reference.
          </p>

          <p className="text-sm text-gray-600">
            You can now proceed to payment. Sign in using the same Google
            account associated with the email address you provided during
            registration.
          </p>

          <Link
            href="/payment"
            className="block w-full rounded-lg bg-[#064B36] px-6 py-4 font-semibold text-white transition hover:bg-[#043b2b]"
          >
            Proceed to Payment
          </Link>
        </div>
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
            Primary Registrant Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>1. Full Name</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>2. Nickname</label>
              <input
                type="text"
                required
                maxLength={50}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="What should we call you?"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>3. Batch / Year Graduated</label>
              <input
                type="text"
                required
                maxLength={50}
                value={batchYear}
                onChange={(e) => setBatchYear(e.target.value)}
                placeholder="e.g. Batch 2015 or 2015"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>4. School Level Graduated</label>
              <select
                required
                value={schoolLevel}
                onChange={(e) =>
                  setSchoolLevel(e.target.value as SchoolLevel)
                }
                className={`${inputClass} bg-white`}
              >
                <option value="college">College</option>
                <option value="high_school">High School</option>
                <option value="junior_high_school">Junior High School</option>
                <option value="senior_high_school">Senior High School</option>
                <option value="elementary">Elementary</option>
                <option value="kinder">Kinder</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>5. Birthday</label>
              <input
                type="date"
                required
                max={getLocalDateString()}
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">
                Month, day, and year
              </p>
            </div>

            <div>
              <label className={labelClass}>6. Current Address</label>
              <textarea
                required
                minLength={5}
                maxLength={300}
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                placeholder="Enter your complete current address"
                rows={3}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>7. Contact Number</label>
              <input
                type="tel"
                required
                pattern="(09[0-9]{9}|\+639[0-9]{9})"
                maxLength={13}
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                title="Enter a valid Philippine mobile number."
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">
                Accepted formats: 09XXXXXXXXX or +639XXXXXXXXX
              </p>
            </div>

            <div>
              <label className={labelClass}>8. Email Address</label>
              <input
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                9. Facebook Account / Profile Link
              </label>
              <input
                type="url"
                required
                maxLength={300}
                value={facebookProfile}
                onChange={(e) => setFacebookProfile(e.target.value)}
                placeholder="https://www.facebook.com/username"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">
                Please provide your Facebook profile URL.
              </p>
            </div>

            <div>
              <label className={labelClass}>10. Work / Occupation</label>
              <input
                type="text"
                required
                maxLength={100}
                value={work}
                onChange={(e) => setWork(e.target.value)}
                placeholder="Enter your current work or occupation"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Attendee Category</label>
              <select
                required
                value={attendeeType}
                onChange={(e) =>
                  setAttendeeType(e.target.value as AttendeeType)
                }
                className={`${inputClass} bg-white`}
              >
                <option value="alumni">Alumni</option>
                <option value="former_teacher">Former Teacher</option>
                <option value="former_staff">Former Staff</option>
                <option value="former_principal">Former Principal</option>
              </select>
              <p className="mt-1 text-xs text-gray-400">
                Select your role or relationship with Unida Christian Colleges.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[#10264C]">Companions</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add each companion who will attend with you. Only their full
                names are required.
              </p>
            </div>

            <button
              type="button"
              onClick={addCompanion}
              disabled={loading}
              className="rounded-lg bg-[#064B36] px-4 py-2 text-sm font-medium text-white hover:bg-[#043b2b] disabled:opacity-50"
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
                  maxLength={100}
                  value={companion}
                  onChange={(e) => updateCompanion(index, e.target.value)}
                  placeholder={`Companion ${index + 1} full name`}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#064B36]"
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => removeCompanion(index)}
                  className="rounded-lg border border-red-200 px-3 text-red-600 hover:bg-red-50 disabled:opacity-50"
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
            role="alert"
            aria-live="polite"
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


"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  SessionProvider,
  signIn,
  signOut,
  useSession,
} from "next-auth/react";

type RegistrationData = {
  registrationNumber: string;
  fullName: string;
  email: string;
  totalAttendees: number;
  feePerPerson: number;
  totalAmount: number;
  registrationStatus: string;
  paymentStatus: string;
};

type PaymentDetails = {
  gcash: {
    accountName: string;
    accountNumber: string;
  };
  bankTransfer: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
};

type LatestPayment = {
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
} | null;

type PaymentLookupResponse = {
  success: boolean;
  message?: string;
  paymentDetails?: PaymentDetails;
  registration?: RegistrationData;
  latestPayment?: LatestPayment;
};

function PaymentPageContent() {
  const { data: session, status } = useSession();
 
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [latestPayment, setLatestPayment] = useState<LatestPayment>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const loadPaymentInformation = useCallback(async () => {
    try {
      const response = await fetch("/api/payments/me", {
        method: "GET",
        cache: "no-store",
      });

      const data: PaymentLookupResponse = await response.json();

      if (!response.ok || !data.success || !data.registration) {
        setRegistration(null);
        setLatestPayment(null);
        setError(data.message || "Unable to load your registration.");
        return;
      }

      setError("");
      setRegistration(data.registration);
      setLatestPayment(data.latestPayment ?? null);
      setPaymentDetails(data.paymentDetails ?? null);
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    fetch("/api/payments/me", {
      method: "GET",
      cache: "no-store",
    })
      .then(async (response) => {
        const data: PaymentLookupResponse = await response.json();

        if (cancelled) return;

        if (!response.ok || !data.success || !data.registration) {
          setRegistration(null);
          setLatestPayment(null);
          setError(data.message || "Unable to load your registration.");
          return;
        }

        setError("");
        setRegistration(data.registration);
        setLatestPayment(data.latestPayment ?? null);
        setPaymentDetails(data.paymentDetails ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to connect to the server. Please try again.");
          setPaymentDetails(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!registration) {
      setError("Registration information is unavailable.");
      setPaymentDetails(null);
      return;
    }

    if (!paymentAccountConfigured) {
  setError("The selected payment account is not yet configured.");
  return;
    }

    if (!referenceNumber.trim()) {
      setError("Please enter your payment reference number.");
      return;
    }

    if (!proof) {
      setError("Please upload your proof of payment.");
      return;
    }

    if (proof.size > 4 * 1024 * 1024) {
      setError("The uploaded file must not exceed 4 MB.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("registrationNumber", registration.registrationNumber);
      formData.append("paymentMethod", paymentMethod);
      formData.append("referenceNumber", referenceNumber.trim());
      formData.append("proof", proof);

      const response = await fetch("/api/payments", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Payment submission failed.");
        return;
      }

      setSuccess(
        data.message || "Your payment proof was submitted successfully."
      );
      setReferenceNumber("");
      setProof(null);
      setFileInputKey((current) => current + 1);

      await loadPaymentInformation();
    } catch {
      setError("Unable to submit your payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const paymentIsComplete =
    registration?.paymentStatus === "paid" ||
    latestPayment?.paymentStatus === "verified" ||
    latestPayment?.paymentStatus === "paid_onsite";

  const paymentIsPending =
    latestPayment?.paymentStatus === "pending" ||
    latestPayment?.paymentStatus === "pending_verification";

    const paymentAccountConfigured =
  paymentMethod === "gcash"
    ? Boolean(
        paymentDetails?.gcash.accountName.trim() &&
          paymentDetails?.gcash.accountNumber.trim()
      )
    : Boolean(
        paymentDetails?.bankTransfer.bankName.trim() &&
          paymentDetails?.bankTransfer.accountName.trim() &&
          paymentDetails?.bankTransfer.accountNumber.trim()
      );

  const isPageLoading =
    status === "loading" || (status === "authenticated" && loading);

  if (isPageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-600">Loading payment information...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Alumni Homecoming 2027
          </h1>
          <p className="mt-2 text-gray-600">Payment Portal</p>
        </div>

        {status === "unauthenticated" ? (
          <section className="rounded-xl border bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              Sign in to continue
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Sign in using the Google account you provided during registration
              to view your payment information.
            </p>

            <button
              onClick={() => signIn("google", { callbackUrl: "/payment" })}
              className="mt-6 rounded-lg bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800"
            >
              Sign in with Google
            </button>
          </section>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between rounded-lg border bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="truncate text-sm font-medium text-gray-800">
                  {session?.user?.email}
                </p>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/payment" })}
                className="ml-4 text-sm font-medium text-blue-700 hover:underline"
              >
                Sign out
              </button>
            </div>

            {error && !registration ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                {error}
              </div>
            ) : registration ? (
              <>
                <section className="rounded-xl border bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Registration Information
                  </h2>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Registration Number</span>
                      <span className="font-semibold text-gray-900">
                        {registration.registrationNumber}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Name</span>
                      <span className="text-right font-medium text-gray-900">
                        {registration.fullName}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Total Attendees</span>
                      <span className="font-medium text-gray-900">
                        {registration.totalAttendees}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Fee per Person</span>
                      <span className="font-medium text-gray-900">
                        ₱{registration.feePerPerson.toLocaleString("en-PH")}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between gap-4">
                        <span className="font-semibold text-gray-700">
                          Total Amount
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                          ₱{registration.totalAmount.toLocaleString("en-PH")}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {paymentIsComplete ? (
                  <section className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6">
                    <h2 className="font-semibold text-green-800">
                      Payment Confirmed
                    </h2>
                    <p className="mt-2 text-sm text-green-700">
                      Your payment has been verified. Thank you for completing
                      your registration!
                    </p>
                  </section>
                ) : paymentIsPending ? (
                  <section className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-6">
                    <h2 className="font-semibold text-yellow-800">
                      Payment Under Verification
                    </h2>
                    <p className="mt-2 text-sm text-yellow-700">
                      Your payment submission has been received. Please wait
                      while the organizing committee verifies it.
                    </p>
                  </section>
                ) : (
                  <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Submit Your Payment
                    </h2>

                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                      Official GCash and bank account details will be displayed
                      here once confirmed by the organizing committee. Please
                      do not send payment to unofficial accounts.
                    </div>

                    {latestPayment?.paymentStatus === "rejected" && (
                      <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        Your previous payment submission was rejected. You may
                        submit a new payment below.
                      </p>
                    )}

                    <form
                      onSubmit={handlePaymentSubmit}
                      className="mt-6 space-y-5"
                    >
                      <div>
                        <label
                          htmlFor="paymentMethod"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Payment Method
                        </label>
                        <select
                          id="paymentMethod"
                          value={paymentMethod}
                          onChange={(event) =>
                            setPaymentMethod(event.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm"
                        >
                          <option value="gcash">GCash</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                      </div>
                          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
  <h3 className="font-semibold text-gray-900">
    {paymentMethod === "gcash"
      ? "GCash Account Details"
      : "Bank Transfer Details"}
  </h3>

  {paymentAccountConfigured ? (
    <div className="mt-3 space-y-2 text-sm">
      {paymentMethod === "gcash" ? (
        <>
          <div>
            <p className="text-gray-500">Account Name</p>
            <p className="font-semibold text-gray-900">
              {paymentDetails?.gcash.accountName}
            </p>
          </div>

          <div>
            <p className="text-gray-500">GCash Mobile Number</p>
            <p className="font-semibold text-gray-900">
              {paymentDetails?.gcash.accountNumber}
            </p>
          </div>
        </>
      ) : (
        <>
          <div>
            <p className="text-gray-500">Bank Name</p>
            <p className="font-semibold text-gray-900">
              {paymentDetails?.bankTransfer.bankName}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Account Name</p>
            <p className="font-semibold text-gray-900">
              {paymentDetails?.bankTransfer.accountName}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Account Number</p>
            <p className="font-semibold text-gray-900">
              {paymentDetails?.bankTransfer.accountNumber}
            </p>
          </div>
        </>
      )}
    </div>
  ) : (
    <p className="mt-2 text-sm text-amber-700">
      Official payment details have not yet been configured for this method.
      Please wait for the organizing committee to provide the correct account
      information. Do not send money to unofficial accounts.
    </p>
  )}
</div>
                      <div>
                        <label
                          htmlFor="referenceNumber"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Payment Reference Number
                        </label>
                        <input
                          id="referenceNumber"
                          type="text"
                          value={referenceNumber}
                          onChange={(event) =>
                            setReferenceNumber(event.target.value)
                          }
                          required
                          maxLength={100}
                          placeholder="Enter your reference number"
                          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="proof"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Proof of Payment
                        </label>
                        <input
                          key={fileInputKey}
                          id="proof"
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          required
                          onChange={(event) =>
                            setProof(event.target.files?.[0] ?? null)
                          }
                          className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          Accepted formats: JPG, PNG, WebP, or PDF. Maximum
                          file size: 4 MB.
                        </p>
                      </div>

                      {error && (
                        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={submitting || !paymentAccountConfigured}
                        className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? "Submitting..." : "Submit Payment"}
                      </button>
                    </form>
                  </section>
                )}

                {success && (
                  <p className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                    {success}
                  </p>
                )}

                {error && registration && (
                  <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </p>
                )}
              </>
            ) : (
              <section className="rounded-xl border bg-white p-6 text-center shadow-sm">
                <p className="text-gray-700">
                  {error || "No registration information was found."}
                </p>
              </section>
            )}
          </>
        )}

        <p className="mt-8 text-center text-xs text-gray-500">
          Unida Christian Colleges Alumni Homecoming 2027
        </p>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <SessionProvider>
      <PaymentPageContent />
    </SessionProvider>
  );
}

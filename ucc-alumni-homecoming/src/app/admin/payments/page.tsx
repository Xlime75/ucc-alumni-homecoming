
"use client";

import { useEffect, useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";

type Payment = {
  _id: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  proofOfPaymentUrl?: string;
  paymentStatus: string;
  createdAt: string;
  registrationId: {
    registrationNumber: string;
    primaryRegistrant: {
      fullName: string;
      email: string;
    };
    totalAttendees: number;
    totalAmount: number;
  } | null;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/payments");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load payments.");
      }

      setPayments(data.payments);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function reviewPayment(
    paymentId: string,
    action: "approve" | "reject"
  ) {
    const confirmed = window.confirm(
      action === "approve"
        ? "Are you sure you want to approve this payment?"
        : "Are you sure you want to reject this payment?"
    );

    if (!confirmed) return;

    try {
      setReviewingId(paymentId);

      const response = await fetch(
        `/api/admin/payments/${paymentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to review payment.");
      }

      window.alert(data.message);

      await loadPayments();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setReviewingId(null);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function fetchPayments() {
      try {
        const response = await fetch("/api/admin/payments");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load payments.");
        }

        if (isActive) {
          setPayments(data.payments);
        }
      } catch (error) {
        if (isActive) {
          setError(
            error instanceof Error
              ? error.message
              : "Something went wrong."
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchPayments();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#F8F1DF] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#D6A84B]">
              UCC Alumni Homecoming 2027
            </p>

            <h1 className="mt-2 font-serif text-4xl font-bold text-[#064B36]">
              Payment Management
            </h1>

            <p className="mt-2 text-gray-600">
              Review submitted registration payments.
            </p>
          </div>

          <button
            onClick={loadPayments}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#064B36] px-4 py-3 font-semibold text-white hover:bg-[#083C2D] disabled:opacity-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CreditCard className="text-[#D6A84B]" size={24} />

            <h2 className="text-xl font-semibold text-[#10264C]">
              Pending Payment Submissions
            </h2>
          </div>

          {loading && (
            <p className="mt-6 text-gray-500">
              Loading payment records...
            </p>
          )}

          {error && (
            <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </p>
          )}

          {!loading && !error && payments.length === 0 && (
            <div className="py-12 text-center">
              <CreditCard
                className="mx-auto text-gray-400"
                size={40}
              />

              <p className="mt-4 font-semibold text-gray-700">
                No pending payments
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Submitted payments will appear here.
              </p>
            </div>
          )}

          {!loading && payments.length > 0 && (
            <div className="mt-6 space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment._id}
                  className="rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#10264C]">
                        {payment.registrationId?.registrationNumber ??
                          "Registration unavailable"}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {payment.registrationId?.primaryRegistrant.fullName ??
                          "Unknown registrant"}
                      </p>
                    </div>

                    <span className="h-fit rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                      Awaiting verification
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500">
                        Amount
                      </p>
                      <p className="font-semibold">
                        ₱{payment.amount.toLocaleString("en-PH")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Payment method
                      </p>
                      <p className="font-semibold capitalize">
                        {payment.paymentMethod.replace("_", " ")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Reference number
                      </p>
                      <p className="font-semibold">
                        {payment.referenceNumber || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Submitted
                      </p>
                      <p className="font-semibold">
                        {new Date(payment.createdAt).toLocaleString("en-PH")}
                      </p>
                    </div>
                  </div>

                  {payment.proofOfPaymentUrl && (
                    <a
                      href={payment.proofOfPaymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-block text-sm font-semibold text-[#064B36] underline"
                    >
                      View payment proof
                    </a>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        reviewPayment(payment._id, "approve")
                      }
                      disabled={reviewingId !== null}
                      className="rounded-lg bg-[#064B36] px-5 py-2.5 font-semibold text-white hover:bg-[#083C2D] disabled:opacity-50"
                    >
                      {reviewingId === payment._id
                        ? "Processing..."
                        : "Approve Payment"}
                    </button>

                    <button
                      onClick={() =>
                        reviewPayment(payment._id, "reject")
                      }
                      disabled={reviewingId !== null}
                      className="rounded-lg border border-red-600 px-5 py-2.5 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {reviewingId === payment._id
                        ? "Processing..."
                        : "Reject Payment"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

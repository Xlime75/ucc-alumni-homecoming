
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  Users,
  ClipboardCheck,
  CreditCard,
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileBarChart,
  Download,
  FileSpreadsheet,
} from "lucide-react";

type ReportsData = {
  success: boolean;
  summary: {
    registrations: {
      total: number;
      pending: number;
      confirmed: number;
      cancelled: number;
    };
    attendees: {
      total: number;
      checkedIn: number;
      notCheckedIn: number;
    };
    payments: {
      pending: number;
      pendingVerification: number;
      verified: number;
      rejected: number;
      paidOnsite: number;
      refunded: number;
    };
    finances: {
      expectedCollection: number;
      collectedAmount: number;
      outstandingAmount: number;
    };
  };
  message?: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            {value}
          </h2>
        </div>
        <div className={`rounded-lg p-3 ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [report, setReport] = useState<ReportsData["summary"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/reports", {
        cache: "no-store",
      });

      const data: ReportsData = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load reports.");
      }

      setReport(data.summary);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function fetchReports() {
      try {
        const response = await fetch("/api/admin/reports", {
          cache: "no-store",
        });

        const data: ReportsData = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load reports.");
        }

        if (isActive) {
          setReport(data.summary);
          setError("");
        }
      } catch (err) {
        if (isActive) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void fetchReports();

    return () => {
      isActive = false;
    };
  }, []);

  const handleExport = (
  type: "registrations" | "payments" | "attendance"
) => {
  window.open(
    `/api/admin/reports/export?type=${type}`,
    "_blank"
  );
};

  const attendanceRate =
    report && report.attendees.total > 0
      ? (
          (report.attendees.checkedIn / report.attendees.total) *
          100
        ).toFixed(1)
      : "0.0";

  const collectionRate =
    report && report.finances.expectedCollection > 0
      ? (
          (report.finances.collectedAmount /
            report.finances.expectedCollection) *
          100
        ).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports and Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View registration, payment, financial, and attendance summaries
            for UCC Alumni Homecoming 2027.
          </p>
        </div>

        <button
          onClick={() => void loadReports()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Reports
        </button>
      </div>

      {/* CSV Exports */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900">
            Download Reports
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Export event records as CSV files for Excel or Google Sheets.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              type: "registrations" as const,
              label: "Export Registrations",
            },
            {
              type: "payments" as const,
              label: "Export Payments",
            },
            {
              type: "attendance" as const,
              label: "Export Attendance",
            },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => handleExport(item.type)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-[#064B36] hover:bg-green-50 hover:text-[#064B36]"
            >
              <FileSpreadsheet size={18} />
              {item.label}
              <Download size={16} />
            </button>
          ))}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading && !report ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 shadow-sm">
          <RefreshCw size={24} className="mx-auto mb-3 animate-spin" />
          Loading reports...
        </div>
      ) : report ? (
        <>
          {/* Registration Statistics */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-[#064B36]" />
              <h2 className="font-semibold text-gray-900">
                Registration Overview
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Registrations"
                value={report.registrations.total}
                icon={Users}
                color="bg-blue-50 text-blue-600"
              />
              <StatCard
                title="Confirmed"
                value={report.registrations.confirmed}
                icon={CheckCircle}
                color="bg-green-50 text-green-600"
              />
              <StatCard
                title="Pending"
                value={report.registrations.pending}
                icon={Clock}
                color="bg-amber-50 text-amber-600"
              />
              <StatCard
                title="Cancelled"
                value={report.registrations.cancelled}
                icon={AlertCircle}
                color="bg-red-50 text-red-600"
              />
            </div>
          </section>

          {/* Attendance Statistics */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={20} className="text-[#064B36]" />
              <h2 className="font-semibold text-gray-900">
                Attendance Overview
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Attendees"
                value={report.attendees.total}
                icon={Users}
                color="bg-blue-50 text-blue-600"
              />
              <StatCard
                title="Checked In"
                value={report.attendees.checkedIn}
                icon={CheckCircle}
                color="bg-green-50 text-green-600"
              />
              <StatCard
                title="Not Checked In"
                value={report.attendees.notCheckedIn}
                icon={Clock}
                color="bg-amber-50 text-amber-600"
              />
              <StatCard
                title="Attendance Rate"
                value={`${attendanceRate}%`}
                icon={TrendingUp}
                color="bg-emerald-50 text-[#064B36]"
              />
            </div>
          </section>

          {/* Payment and Financial Summary */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard size={20} className="text-[#064B36]" />
              <h2 className="font-semibold text-gray-900">
                Payment Overview
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                title="Pending Payments"
                value={report.payments.pending}
                icon={Clock}
                color="bg-amber-50 text-amber-600"
              />
              <StatCard
                title="For Verification"
                value={report.payments.pendingVerification}
                icon={AlertCircle}
                color="bg-orange-50 text-orange-600"
              />
              <StatCard
                title="Verified Payments"
                value={report.payments.verified}
                icon={CheckCircle}
                color="bg-green-50 text-green-600"
              />
              <StatCard
                title="Paid Onsite"
                value={report.payments.paidOnsite}
                icon={Wallet}
                color="bg-blue-50 text-blue-600"
              />
              <StatCard
                title="Rejected Payments"
                value={report.payments.rejected}
                icon={AlertCircle}
                color="bg-red-50 text-red-600"
              />
              <StatCard
                title="Refunded Payments"
                value={report.payments.refunded}
                icon={CreditCard}
                color="bg-gray-100 text-gray-600"
              />
            </div>
          </section>

          {/* Financial Summary */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Wallet size={20} className="text-[#064B36]" />
              <h2 className="font-semibold text-gray-900">
                Financial Summary
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-500">
                  Expected Collection
                </p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {formatCurrency(report.finances.expectedCollection)}
                </h2>
                <p className="mt-2 text-xs text-gray-500">
                  Based on non-cancelled registrations.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-500">
                  Collected Amount
                </p>
                <h2 className="mt-2 text-3xl font-bold text-green-600">
                  {formatCurrency(report.finances.collectedAmount)}
                </h2>
                <p className="mt-2 text-xs text-gray-500">
                  Based on verified and paid onsite payment records.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-500">
                  Outstanding Amount
                </p>
                <h2 className="mt-2 text-3xl font-bold text-amber-600">
                  {formatCurrency(report.finances.outstandingAmount)}
                </h2>
                <p className="mt-2 text-xs text-gray-500">
                  Remaining expected collection.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-500">
                    Collection Rate
                  </p>
                  <TrendingUp size={20} className="text-[#064B36]" />
                </div>
                <h2 className="mt-2 text-3xl font-bold text-[#064B36]">
                  {collectionRate}%
                </h2>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#064B36] transition-all"
                    style={{
                      width: `${Math.min(Number(collectionRate), 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Collected amount compared with expected collection.
                </p>
              </div>
            </div>
          </section>

          {/* Report Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[#064B36]/10 p-3 text-[#064B36]">
                <FileBarChart size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Homecoming Report Summary
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  These figures are retrieved from the current registration,
                  payment, attendee, and attendance records in the database.
                  Use Refresh Reports to retrieve the latest information.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

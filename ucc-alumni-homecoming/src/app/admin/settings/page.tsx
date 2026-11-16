
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Settings,
  Save,
  RefreshCw,
  CalendarDays,
  MapPin,
  PhilippinePeso,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

type EventSettings = {
  eventName: string;
  date: string;
  venue: string;
  feePerPerson: number;
  registrationOpen: boolean;
  checkInEnabled: boolean;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [feePerPerson, setFeePerPerson] = useState("200");
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [checkInEnabled, setCheckInEnabled] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load event settings.");
      }

      const currentSettings = data.settings as EventSettings;

      setSettings(currentSettings);
      setFeePerPerson(String(currentSettings.feePerPerson));
      setRegistrationOpen(currentSettings.registrationOpen);
      setCheckInEnabled(currentSettings.checkInEnabled);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading settings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
  let isActive = true;

  async function fetchInitialSettings() {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load event settings.");
      }

      if (!isActive) return;

      const currentSettings = data.settings as EventSettings;

      setSettings(currentSettings);
      setFeePerPerson(String(currentSettings.feePerPerson));
      setRegistrationOpen(currentSettings.registrationOpen);
      setCheckInEnabled(currentSettings.checkInEnabled);
    } catch (err) {
      if (!isActive) return;

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading settings."
      );
    } finally {
      if (isActive) {
        setLoading(false);
      }
    }
  }

  void fetchInitialSettings();

  return () => {
    isActive = false;
  };
}, []);

  async function handleSave() {
    setMessage("");
    setError("");

    const fee = Number(feePerPerson);

    if (!Number.isFinite(fee) || fee <= 0 || fee > 100000) {
      setError("Please enter a valid registration fee.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feePerPerson: fee,
          registrationOpen,
          checkInEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save event settings.");
      }

      setMessage("Event settings saved successfully!");
      await loadSettings();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#064B36]" size={32} />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-800">
          Unable to load event settings.
        </p>

        <p className="mt-2 text-sm text-red-700">{error}</p>

        <button
          onClick={loadSettings}
          className="mt-4 rounded-lg bg-[#064B36] px-4 py-2 text-sm font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="text-[#064B36]" size={26} />

            <h1 className="text-2xl font-bold text-[#10264C]">
              Event Settings
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Manage registration and attendance settings.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#10264C]">
          Event Information
        </h2>

        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-[#064B36]" size={20} />

            <div>
              <p className="text-xs text-gray-500">Event Name</p>
              <p className="font-semibold text-gray-800">
                {settings.eventName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CalendarDays className="text-[#064B36]" size={20} />

            <div>
              <p className="text-xs text-gray-500">Event Date</p>
              <p className="font-semibold text-gray-800">
                {new Date(settings.date).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  timeZone: "Asia/Manila",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="text-[#064B36]" size={20} />

            <div>
              <p className="text-xs text-gray-500">Venue</p>
              <p className="font-semibold text-gray-800">
                {settings.venue}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#10264C]">
          Registration Settings
        </h2>

        <div className="mt-5">
          <label
            htmlFor="feePerPerson"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Registration Fee Per Person
          </label>

          <div className="relative max-w-sm">
            <PhilippinePeso
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              id="feePerPerson"
              type="number"
              min="1"
              max="100000"
              step="0.01"
              value={feePerPerson}
              onChange={(event) => setFeePerPerson(event.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-gray-800 outline-none focus:border-[#064B36] focus:ring-2 focus:ring-[#064B36]/10"
            />
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Current fee: ₱{settings.feePerPerson.toLocaleString("en-PH")} per person.
            New registrations will use the updated fee.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
          <div>
            <p className="font-semibold text-gray-800">
              Registration Status
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Allow attendees to submit registrations.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={registrationOpen}
            onClick={() => setRegistrationOpen(!registrationOpen)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              registrationOpen ? "bg-[#064B36]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                registrationOpen ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        <p
          className={`mt-3 text-sm font-medium ${
            registrationOpen ? "text-green-700" : "text-gray-500"
          }`}
        >
          {registrationOpen
            ? "Registration is currently OPEN."
            : "Registration is currently CLOSED."}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#10264C]">
          Attendance Settings
        </h2>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-800">
              QR Check-in
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Allow attendees to use the QR attendance system.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={checkInEnabled}
            onClick={() => setCheckInEnabled(!checkInEnabled)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              checkInEnabled ? "bg-[#064B36]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                checkInEnabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        <p
          className={`mt-3 text-sm font-medium ${
            checkInEnabled ? "text-green-700" : "text-gray-500"
          }`}
        >
          {checkInEnabled
            ? "QR Check-in is ENABLED."
            : "QR Check-in is DISABLED."}
        </p>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle size={18} />
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#064B36] px-6 py-3 font-semibold text-white transition hover:bg-[#053b2b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}

          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

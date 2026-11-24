
import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Registration from "@/models/Registration";
import Attendee from "@/models/Attendee";
import Payment from "@/models/Payment";
import Attendance from "@/models/Attendance";
import { requireAdmin } from "@/lib/admin-auth";

type ExportType = "registrations" | "payments" | "attendance";

function csvEscape(value: unknown): string {
  let text = "";

  if (value instanceof Date) {
    text = value.toISOString();
  } else if (value !== null && value !== undefined) {
    text = String(value);
  }

  // Prevent CSV formula injection when opened in spreadsheet software.
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function createCSV(headers: string[], rows: unknown[][]) {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];

  // UTF-8 BOM helps Excel recognize the file encoding.
  return "\uFEFF" + lines.join("\r\n");
}

function createCSVResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    if (!admin.authorized) {
      return admin.response;
    }

    await connectDB();

    const type = request.nextUrl.searchParams.get("type") as
      | ExportType
      | null;

    const date = new Date().toISOString().slice(0, 10);

    if (type === "registrations") {
      const registrations = await Registration.find()
        .sort({ registeredAt: -1 })
        .lean();

      const rows = registrations.map((registration) => [
        registration.registrationNumber,
        registration.primaryRegistrant.fullName,
        registration.primaryRegistrant.nickname,
        registration.primaryRegistrant.email,
        registration.primaryRegistrant.contactNumber,
        registration.primaryRegistrant.attendeeType,
        registration.primaryRegistrant.batchYear,
        registration.primaryRegistrant.schoolLevel,
        registration.totalAttendees,
        registration.feePerPerson,
        registration.totalAmount,
        registration.registrationStatus,
        registration.paymentStatus,
        registration.registeredAt,
      ]);

      const csv = createCSV(
        [
          "Registration Number",
          "Primary Registrant",
          "Nickname",
          "Email",
          "Contact Number",
          "Attendee Type",
          "Batch Year",
          "School Level",
          "Total Attendees",
          "Fee Per Person",
          "Total Amount",
          "Registration Status",
          "Payment Status",
          "Registration Date",
        ],
        rows
      );

      return createCSVResponse(
        csv,
        `ucc-registrations-${date}.csv`
      );
    }

    if (type === "payments") {
      const payments = await Payment.find()
        .sort({ createdAt: -1 })
        .lean();

      const registrationIds = [
        ...new Set(
          payments.map((payment) => payment.registrationId.toString())
        ),
      ];

      const registrations = await Registration.find({
        _id: { $in: registrationIds },
      })
        .select("registrationNumber primaryRegistrant.fullName primaryRegistrant.email")
        .lean();

      const registrationMap = new Map(
        registrations.map((registration) => [
          registration._id.toString(),
          registration,
        ])
      );

      const rows = payments.map((payment) => {
        const registration = registrationMap.get(
          payment.registrationId.toString()
        );

        return [
          registration?.registrationNumber ?? "",
          registration?.primaryRegistrant?.fullName ?? "",
          registration?.primaryRegistrant?.email ?? "",
          payment.paymentMethod,
          payment.referenceNumber ?? "",
          payment.amount,
          payment.paymentStatus,
          payment.verifiedBy ?? "",
          payment.verifiedAt ?? "",
          payment.createdAt,
        ];
      });

      const csv = createCSV(
        [
          "Registration Number",
          "Primary Registrant",
          "Email",
          "Payment Method",
          "Reference Number",
          "Amount",
          "Payment Status",
          "Verified By",
          "Verified At",
          "Payment Date",
        ],
        rows
      );

      return createCSVResponse(
        csv,
        `ucc-payments-${date}.csv`
      );
    }

    if (type === "attendance") {
      const attendees = await Attendee.find()
        .sort({ fullName: 1 })
        .lean();

      const registrationIds = [
        ...new Set(
          attendees.map((attendee) => attendee.registrationId.toString())
        ),
      ];

      const [registrations, attendanceRecords] = await Promise.all([
        Registration.find({
          _id: { $in: registrationIds },
        })
          .select("registrationNumber registrationStatus paymentStatus")
          .lean(),

        Attendance.find({
          attendeeId: { $in: attendees.map((attendee) => attendee._id) },
        }).lean(),
      ]);

      const registrationMap = new Map(
        registrations.map((registration) => [
          registration._id.toString(),
          registration,
        ])
      );

      const attendanceMap = new Map(
        attendanceRecords.map((record) => [
          record.attendeeId.toString(),
          record,
        ])
      );

      const rows = attendees.map((attendee) => {
        const registration = registrationMap.get(
          attendee.registrationId.toString()
        );

        const attendance = attendanceMap.get(attendee._id.toString());

        return [
          attendee.fullName,
          attendee.attendeeType,
          attendee.isPrimaryRegistrant ? "Yes" : "No",
          registration?.registrationNumber ?? "",
          registration?.registrationStatus ?? "",
          registration?.paymentStatus ?? "",
          attendance ? "Checked In" : "Not Checked In",
          attendance?.checkInMethod ?? "",
          attendance?.checkedInBy ?? "",
          attendance?.checkedInAt ?? "",
        ];
      });

      const csv = createCSV(
        [
          "Attendee Name",
          "Attendee Type",
          "Primary Registrant",
          "Registration Number",
          "Registration Status",
          "Payment Status",
          "Attendance Status",
          "Check-in Method",
          "Checked In By",
          "Check-in Date",
        ],
        rows
      );

      return createCSVResponse(
        csv,
        `ucc-attendance-${date}.csv`
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Invalid export type. Use registrations, payments, or attendance.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin CSV export error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to export report.",
      },
      { status: 500 }
    );
  }
}

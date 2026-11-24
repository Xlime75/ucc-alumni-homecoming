
import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Registration from "@/models/Registration";
import Attendee from "@/models/Attendee";
import Attendance from "@/models/Attendance";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    if (!admin.authorized) {
      return admin.response;
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const attendeeType = searchParams.get("attendeeType") || "all";
    const attendanceStatus =
      searchParams.get("attendanceStatus") || "all";
    const registrationStatus =
      searchParams.get("registrationStatus") || "all";
    const paymentStatus = searchParams.get("paymentStatus") || "all";

    // Filter registrations.
    const registrationFilter: Record<string, unknown> = {};

    if (
      ["pending", "confirmed", "cancelled"].includes(registrationStatus)
    ) {
      registrationFilter.registrationStatus = registrationStatus;
    }

    if (
      ["pending", "partial", "paid", "overpaid", "refunded"].includes(
        paymentStatus
      )
    ) {
      registrationFilter.paymentStatus = paymentStatus;
    }

    const registrations = await Registration.find(registrationFilter)
      .select(
        "_id registrationNumber registrationStatus paymentStatus totalAttendees totalAmount"
      )
      .lean();

    if (registrations.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        checkedInCount: 0,
        notCheckedInCount: 0,
        attendees: [],
      });
    }

    const registrationMap = new Map(
      registrations.map((registration) => [
        registration._id.toString(),
        registration,
      ])
    );

    const registrationIds = registrations.map(
      (registration) => registration._id
    );

    // Filter attendees.
    const attendeeFilter: Record<string, unknown> = {
      registrationId: { $in: registrationIds },
    };

    if (
      [
        "alumni",
        "former_teacher",
        "former_staff",
        "former_principal",
        "companion",
      ].includes(attendeeType)
    ) {
      attendeeFilter.attendeeType = attendeeType;
    }

    if (search) {
      const matchingRegistrations = await Registration.find({
        ...registrationFilter,
        registrationNumber: {
          $regex: search,
          $options: "i",
        },
      })
        .select("_id")
        .lean();

      const matchingRegistrationIds = matchingRegistrations.map(
        (registration) => registration._id
      );

      attendeeFilter.$or = [
        {
          fullName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          registrationId: {
            $in: matchingRegistrationIds,
          },
        },
      ];
    }

    const attendees = await Attendee.find(attendeeFilter)
      .sort({ fullName: 1 })
      .lean();

    if (attendees.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        checkedInCount: 0,
        notCheckedInCount: 0,
        attendees: [],
      });
    }

    // Retrieve attendance records for the selected attendees.
    const attendeeIds = attendees.map((attendee) => attendee._id);

    const attendanceRecords = await Attendance.find({
      attendeeId: { $in: attendeeIds },
    }).lean();

    const attendanceMap = new Map(
      attendanceRecords.map((record) => [
        record.attendeeId.toString(),
        record,
      ])
    );

    // Combine attendee, registration, and attendance information.
    const results = attendees
      .map((attendee) => {
        const registration = registrationMap.get(
          attendee.registrationId.toString()
        );

        if (!registration) {
          return null;
        }

        const attendance = attendanceMap.get(attendee._id.toString());

        return {
          _id: attendee._id.toString(),
          fullName: attendee.fullName,
          attendeeType: attendee.attendeeType,
          isPrimaryRegistrant: attendee.isPrimaryRegistrant,

          registrationNumber: registration.registrationNumber,
          registrationStatus: registration.registrationStatus,
          paymentStatus: registration.paymentStatus,
          totalAmount: registration.totalAmount,

          attendanceStatus: attendance ? "checked_in" : "not_checked_in",
          checkedIn: Boolean(attendance),
          checkedInAt: attendance?.checkedInAt ?? null,
          checkInMethod: attendance?.checkInMethod ?? null,
          checkedInBy: attendance?.checkedInBy ?? null,
        };
      })
      .filter((attendee) => {
        if (!attendee) return false;

        if (attendanceStatus === "checked_in") {
          return attendee.checkedIn;
        }

        if (attendanceStatus === "not_checked_in") {
          return !attendee.checkedIn;
        }

        return true;
      });

    const checkedInCount = results.filter(
      (attendee) => attendee?.checkedIn
    ).length;

    return NextResponse.json(
      {
        success: true,
        total: results.length,
        checkedInCount,
        notCheckedInCount: results.length - checkedInCount,
        attendees: results,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Admin attendance retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve attendance records.",
      },
      { status: 500 }
    );
  }
}

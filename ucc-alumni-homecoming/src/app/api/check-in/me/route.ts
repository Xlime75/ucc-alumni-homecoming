
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import Attendee from "@/models/Attendee";
import Attendance from "@/models/Attendance";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate the Google account.
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const email =
      typeof token?.email === "string"
        ? token.email.trim().toLowerCase()
        : null;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Please sign in with your registered Google account.",
        },
        { status: 401 }
      );
    }

    // 2. Connect to MongoDB.
    await connectDB();

    // 3. Check whether event check-in is enabled.
    const event = await Event.findOne().lean();

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event settings were not found.",
        },
        { status: 404 }
      );
    }

    if (!event.checkInEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: "Online check-in is currently closed.",
        },
        { status: 403 }
      );
    }

    // 4. Find the registration using the verified email.
    const registration = await Registration.findOne({
      "primaryRegistrant.email": email,
    }).lean();

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          message: "No registration was found for this Google account.",
        },
        { status: 404 }
      );
    }

    // 5. Verify registration status.
    if (registration.registrationStatus === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          message: "This registration has been cancelled.",
        },
        { status: 403 }
      );
    }

    if (
      registration.registrationStatus !== "confirmed" ||
      registration.paymentStatus !== "paid"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your registration must be confirmed and fully paid before check-in.",
        },
        { status: 403 }
      );
    }

    // 6. Retrieve all attendees under this registration.
    const attendees = await Attendee.find({
      registrationId: registration._id,
    })
      .select("_id fullName attendeeType isPrimaryRegistrant")
      .sort({ isPrimaryRegistrant: -1, createdAt: 1 })
      .lean();

    // 7. Retrieve existing attendance records.
    const attendanceRecords = await Attendance.find({
      registrationId: registration._id,
    })
      .select("attendeeId checkedInAt")
      .lean();

    const attendanceMap = new Map(
      attendanceRecords.map((record) => [
        record.attendeeId.toString(),
        record.checkedInAt,
      ])
    );

    // 8. Return attendee information and attendance status.
    const attendeeList = attendees.map((attendee) => {
      const checkedInAt = attendanceMap.get(
        attendee._id.toString()
      );

      return {
        id: attendee._id.toString(),
        fullName: attendee.fullName,
        attendeeType: attendee.attendeeType,
        isPrimaryRegistrant: attendee.isPrimaryRegistrant,
        checkedIn: Boolean(checkedInAt),
        checkedInAt: checkedInAt ?? null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        registration: {
          registrationNumber: registration.registrationNumber,
          totalAttendees: registration.totalAttendees,
          totalAmount: registration.totalAmount,
        },
        attendees: attendeeList,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Check-in lookup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while loading check-in details.",
      },
      { status: 500 }
    );
  }
}

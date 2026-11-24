
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin-auth";

import Event from "@/models/Event";
import Registration from "@/models/Registration";
import Attendee from "@/models/Attendee";
import Attendance from "@/models/Attendance";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attendeeId: string }> }
) {
  const auth = await requireAdmin(request);

  if (!auth.authorized) {
    return auth.response;
  }

  const { attendeeId } = await params;

  if (!mongoose.Types.ObjectId.isValid(attendeeId)) {
    return NextResponse.json(
      { success: false, message: "Invalid attendee ID." },
      { status: 400 }
    );
  }

  const session = await mongoose.startSession();

  try {
    await connectDB();

    let result: {
      attendeeName: string;
      checkedInAt: Date;
    } | null = null;

    await session.withTransaction(async () => {
      const event = await Event.findOne({
        eventName: "Alumni Homecoming 2027",
      }).session(session);

      if (!event || !event.checkInEnabled) {
        throw new Error("CHECKIN_CLOSED");
      }

      const attendee = await Attendee.findById(attendeeId).session(session);

      if (!attendee) {
        throw new Error("ATTENDEE_NOT_FOUND");
      }

      const registration = await Registration.findById(
        attendee.registrationId
      ).session(session);

      if (!registration) {
        throw new Error("REGISTRATION_NOT_FOUND");
      }

      if (registration.registrationStatus === "cancelled") {
        throw new Error("REGISTRATION_CANCELLED");
      }

      if (
        registration.registrationStatus !== "confirmed" ||
        registration.paymentStatus !== "paid"
      ) {
        throw new Error("PAYMENT_NOT_CONFIRMED");
      }

      const existingAttendance = await Attendance.findOne({
        attendeeId: attendee._id,
      }).session(session);

      if (existingAttendance) {
        throw new Error("ALREADY_CHECKED_IN");
      }

      const checkedInAt = new Date();

      await Attendance.create(
        [
          {
            registrationId: registration._id,
            attendeeId: attendee._id,
            attendeeName: attendee.fullName,
            attendeeType: attendee.attendeeType,
            checkInMethod: "manual",
            checkedInBy: auth.email,
            checkedInAt,
          },
        ],
        { session }
      );

      const updateResult = await Attendee.updateOne(
        {
          _id: attendee._id,
          attendanceStatus: "not_checked_in",
        },
        {
          $set: { attendanceStatus: "checked_in" },
        },
        { session }
      );

      if (updateResult.modifiedCount !== 1) {
        throw new Error("ALREADY_CHECKED_IN");
      }

      result = {
        attendeeName: attendee.fullName,
        checkedInAt,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Attendee checked in successfully.",
      attendee: result,
      checkedInBy: auth.email,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "UNKNOWN_ERROR";

    const knownErrors: Record<string, { status: number; message: string }> = {
      CHECKIN_CLOSED: {
        status: 403,
        message: "Online check-in is currently closed.",
      },
      ATTENDEE_NOT_FOUND: {
        status: 404,
        message: "Attendee not found.",
      },
      REGISTRATION_NOT_FOUND: {
        status: 404,
        message: "Registration not found.",
      },
      REGISTRATION_CANCELLED: {
        status: 400,
        message: "This registration has been cancelled.",
      },
      PAYMENT_NOT_CONFIRMED: {
        status: 403,
        message: "Only fully paid and confirmed registrations can check in.",
      },
      ALREADY_CHECKED_IN: {
        status: 409,
        message: "This attendee has already been checked in.",
      },
    };

    const knownError = knownErrors[message];

    if (knownError) {
      return NextResponse.json(
        { success: false, message: knownError.message },
        { status: knownError.status }
      );
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { success: false, message: "This attendee has already been checked in." },
        { status: 409 }
      );
    }

    console.error("Manual check-in error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to check in attendee." },
      { status: 500 }
    );
  } finally {
    await session.endSession();
  }
}

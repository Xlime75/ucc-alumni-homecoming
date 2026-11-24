
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import Attendee from "@/models/Attendee";
import Attendance from "@/models/Attendance";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the primary registrant.
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

    // 2. Validate the submitted attendee IDs.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      !("attendeeIds" in body) ||
      !Array.isArray(body.attendeeIds)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide the attendees to check in.",
        },
        { status: 400 }
      );
    }

    const attendeeIds: unknown[] = body.attendeeIds;

    if (
      attendeeIds.length === 0 ||
      attendeeIds.length > 100 ||
      !attendeeIds.every(
        (id) =>
          typeof id === "string" &&
          mongoose.Types.ObjectId.isValid(id)
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid attendee selection.",
        },
        { status: 400 }
      );
    }

    const normalizedIds = attendeeIds.map((id) =>
      (id as string).toLowerCase()
    );

    if (new Set(normalizedIds).size !== normalizedIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate attendees were selected.",
        },
        { status: 400 }
      );
    }

    // 3. Connect to MongoDB.
    await connectDB();

    // 4. Verify that event check-in is enabled.
    const event = await Event.findOne().lean();

    if (!event || !event.checkInEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: "Online check-in is currently closed.",
        },
        { status: 403 }
      );
    }

    // 5. Find the registration owned by this Google account.
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
          message: "Your registration must be confirmed and fully paid.",
        },
        { status: 403 }
      );
    }

    // 6. Confirm that every selected attendee belongs to this registration.
    const attendees = await Attendee.find({
      _id: {
        $in: normalizedIds.map(
          (id) => new mongoose.Types.ObjectId(id)
        ),
      },
      registrationId: registration._id,
    }).lean();

    if (attendees.length !== normalizedIds.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more selected attendees do not belong to your registration.",
        },
        { status: 403 }
      );
    }

    // 7. Reject attendees who have already checked in.
    const existingAttendance = await Attendance.find({
      attendeeId: { $in: attendees.map((attendee) => attendee._id) },
    }).lean();

    if (existingAttendance.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more selected attendees have already checked in. Please refresh the page.",
        },
        { status: 409 }
      );
    }

    // 8. Record attendance and update attendee statuses atomically.
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const attendanceRecords = attendees.map((attendee) => ({
        registrationId: registration._id,
        attendeeId: attendee._id,
        attendeeName: attendee.fullName,
        attendeeType: attendee.attendeeType,
        checkInMethod: "qr_code" as const,
        checkedInBy: email,
        checkedInAt: new Date(),
      }));

      await Attendance.insertMany(attendanceRecords, {
        session,
        ordered: true,
      });

      await Attendee.updateMany(
        {
          _id: { $in: attendees.map((attendee) => attendee._id) },
          registrationId: registration._id,
        },
        {
          $set: {
            attendanceStatus: "checked_in",
          },
        },
        { session }
      );

      await session.commitTransaction();

      return NextResponse.json(
        {
          success: true,
          message: "Attendance recorded successfully!",
          checkedInCount: attendees.length,
          attendees: attendees.map((attendee) => ({
            id: attendee._id.toString(),
            fullName: attendee.fullName,
          })),
        },
        { status: 201 }
      );
    } catch (error) {
      await session.abortTransaction();

      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more attendees have already been checked in.",
          },
          { status: 409 }
        );
      }

      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error("Check-in submission error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while recording attendance.",
      },
      { status: 500 }
    );
  }
}

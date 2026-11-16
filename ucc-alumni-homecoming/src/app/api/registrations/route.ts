
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { randomBytes } from "crypto";
import { z } from "zod";

import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import Attendee from "@/models/Attendee";

const registrationSchema = z.object({
  primaryRegistrant: z.object({
    fullName: z.string().trim().min(2),
    email: z.string().trim().email(),
    contactNumber: z.string().trim().min(7),
    attendeeType: z.enum([
      "alumni",
      "former_teacher",
      "former_staff",
    ]),
  }),
  companions: z.array(
    z.object({
      fullName: z.string().trim().min(2),
    })
  ).default([]),
});

export async function POST(request: NextRequest) {
  let session: mongoose.ClientSession | null = null;

  try {
    await connectDB();

    const body = await request.json();
    const validation = registrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check your registration information.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { primaryRegistrant, companions } = validation.data;

    // Find the current event configuration.
    const event = await Event.findOne({
      eventName: "Alumni Homecoming 2027",
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event configuration not found." },
        { status: 404 }
      );
    }

    // Do not accept registrations while registration is closed.
    if (!event.registrationOpen) {
      return NextResponse.json(
        { success: false, message: "Registration is currently closed." },
        { status: 403 }
      );
    }

    if (event.feePerPerson <= 0) {
      return NextResponse.json(
        { success: false, message: "Registration fee is not configured." },
        { status: 503 }
      );
    }

    // Prevent duplicate primary registrant emails.
    const existingRegistration = await Registration.findOne({
      "primaryRegistrant.email": primaryRegistrant.email.toLowerCase(),
      registrationStatus: { $ne: "cancelled" },
    });

    if (existingRegistration) {
      return NextResponse.json(
        {
          success: false,
          message: "This email already has an active registration.",
        },
        { status: 409 }
      );
    }

    const totalAttendees = 1 + companions.length;
    const totalAmount = totalAttendees * event.feePerPerson;

    const registrationNumber =
      `UCC-2027-${randomBytes(4).toString("hex").toUpperCase()}`;

    // Start a database transaction.
    session = await mongoose.startSession();
    session.startTransaction();

    const [registration] = await Registration.create(
      [
        {
          registrationNumber,
          primaryRegistrant,
          totalAttendees,
          feePerPerson: event.feePerPerson,
          totalAmount,
          registrationStatus: "pending",
          paymentStatus: "pending",
        },
      ],
      { session }
    );

    const attendeeRecords = [
      {
        registrationId: registration._id,
        fullName: primaryRegistrant.fullName,
        email: primaryRegistrant.email,
        attendeeType: primaryRegistrant.attendeeType,
        isPrimaryRegistrant: true,
        attendanceStatus: "not_checked_in",
      },
      ...companions.map((companion) => ({
        registrationId: registration._id,
        fullName: companion.fullName,
        attendeeType: "companion" as const,
        isPrimaryRegistrant: false,
        attendanceStatus: "not_checked_in" as const,
      })),
    ];

    await Attendee.insertMany(attendeeRecords, { session });

    await session.commitTransaction();

    return NextResponse.json(
      {
        success: true,
        message: "Registration submitted successfully!",
        registration: {
          registrationNumber,
          totalAttendees,
          feePerPerson: event.feePerPerson,
          totalAmount,
          paymentStatus: "pending",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Registration API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while processing registration.",
      },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

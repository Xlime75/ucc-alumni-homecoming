
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { randomBytes } from "crypto";
import { z } from "zod";

import { registrationRatelimit } from "@/lib/ratelimit";
import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import Attendee from "@/models/Attendee";

const MAX_REQUEST_SIZE = 20 * 1024;

const birthdaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid birthday format.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Please enter a valid birthday.")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const registrationSchema = z.object({
  primaryRegistrant: z.object({
    fullName: z.string().trim().min(2).max(100),
    nickname: z.string().trim().min(1).max(50),
    batchYear: z.string().trim().min(1).max(50),

    schoolLevel: z.enum([
      "college",
      "high_school",
      "junior_high_school",
      "senior_high_school",
      "elementary",
      "kinder",
    ]),

    birthday: birthdaySchema,

    currentAddress: z.string().trim().min(5).max(300),

    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),

    contactNumber: z
      .string()
      .trim()
      .regex(
        /^(09\d{9}|\+639\d{9})$/,
        "Enter a valid Philippine mobile number."
      ),

    facebookProfile: z
      .string()
      .trim()
      .max(300)
      .url()
      .refine((value) => {
        try {
          const url = new URL(value);

          return (
            url.protocol === "https:" &&
            (url.hostname === "facebook.com" ||
              url.hostname.endsWith(".facebook.com"))
          );
        } catch {
          return false;
        }
      }, "Please enter a valid Facebook profile URL."),

    work: z.string().trim().min(1).max(100),

    attendeeType: z.enum([
      "alumni",
      "former_teacher",
      "former_staff",
      "former_principal",
    ]),
  }),

  companions: z
    .array(
      z.object({
        fullName: z.string().trim().min(2).max(100),
      })
    )
    .max(10, "You can register a maximum of 10 companions.")
    .default([]),
});

export async function POST(request: NextRequest) {
  let session: mongoose.ClientSession | null = null;

  try {
    // Identify the client IP using Vercel's forwarded IP header.
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim();

    if (!clientIp) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to identify your connection. Please try again.",
        },
        { status: 400 }
      );
    }

    // Apply registration rate limiting.
    const { success, limit, remaining, reset } =
      await registrationRatelimit.limit(clientIp);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many registration attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
            "Retry-After": String(
              Math.max(1, Math.ceil((reset - Date.now()) / 1000))
            ),
          },
        }
      );
    }

    // Check the declared request size.
    const contentLength = request.headers.get("content-length");

    if (contentLength !== null) {
      const size = Number(contentLength);

      if (
        !Number.isSafeInteger(size) ||
        size < 0 ||
        size > MAX_REQUEST_SIZE
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Registration request is too large or invalid.",
          },
          { status: 413 }
        );
      }
    }

    // Read the request body with a streaming size limit.
    const reader = request.body?.getReader();

    if (!reader) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid registration request.",
        },
        { status: 400 }
      );
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > MAX_REQUEST_SIZE) {
        await reader.cancel();

        return NextResponse.json(
          {
            success: false,
            message: "Registration request is too large.",
          },
          { status: 413 }
        );
      }

      chunks.push(value);
    }

    // Combine the body chunks.
    const bodyBytes = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      bodyBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    // Parse JSON safely.
    let body: unknown;

    try {
      const bodyText = new TextDecoder("utf-8", {
        fatal: true,
      }).decode(bodyBytes);

      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid registration request.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Validate registration information.
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
        {
          success: false,
          message: "Event configuration not found.",
        },
        { status: 404 }
      );
    }

    // Check whether registration is open.
    if (!event.registrationOpen) {
      return NextResponse.json(
        {
          success: false,
          message: "Registration is currently closed.",
        },
        { status: 403 }
      );
    }

    // Check whether the registration fee is configured.
    if (event.feePerPerson <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Registration fee is not configured.",
        },
        { status: 503 }
      );
    }

    // Prevent duplicate active primary registrant emails.
    const existingRegistration = await Registration.findOne({
      "primaryRegistrant.email": primaryRegistrant.email,
      registrationStatus: {
        $in: ["pending", "confirmed"],
      },
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

    // Calculate the registration amount using the database fee.
    const totalAttendees = 1 + companions.length;
    const totalAmount = totalAttendees * event.feePerPerson;

    // Generate a unique registration number.
    const registrationNumber =
      `UCC-2027-${randomBytes(4).toString("hex").toUpperCase()}`;

    // Start a database transaction.
    session = await mongoose.startSession();
    session.startTransaction();

    // Create the main registration record.
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

    // Create primary registrant and companion attendee records.
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

    // Commit the transaction.
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
    // Roll back the transaction if an error occurs.
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    // Handle duplicate MongoDB index errors.
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
            "This email already has an active registration. Please check your information.",
        },
        { status: 409 }
      );
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

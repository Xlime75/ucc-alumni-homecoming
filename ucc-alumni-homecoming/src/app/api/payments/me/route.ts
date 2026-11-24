
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import connectDB from "@/lib/mongodb";
import Registration from "@/models/Registration";
import Payment from "@/models/Payment";
import Event from "@/models/Event";

export async function GET(request: NextRequest) {
  try {
    // Authenticate using the Google session.
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const email =
      typeof token?.email === "string"
        ? token.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Please sign in using your registered Google account.",
        },
        { status: 401 }
      );
    }

    await connectDB();

    // Find only the registration belonging to this Google account.
    const registration = await Registration.findOne({
      "primaryRegistrant.email": email,
      registrationStatus: { $ne: "cancelled" },
    }).lean();

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No active registration was found for this Google account. Please use the email address you provided during registration.",
        },
        { status: 404 }
      );
    }

    // Retrieve the latest payment submission.
    const latestPayment = await Payment.findOne({
      registrationId: registration._id,
    })
      .select("paymentStatus paymentMethod createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Retrieve only the payment details intended for attendees.
    const event = await Event.findOne()
      .select(
        "gcashAccountName gcashAccountNumber bankName bankAccountName bankAccountNumber"
      )
      .lean();

    return NextResponse.json({
      success: true,

      registration: {
        registrationNumber: registration.registrationNumber,
        fullName: registration.primaryRegistrant.fullName,
        email: registration.primaryRegistrant.email,
        totalAttendees: registration.totalAttendees,
        feePerPerson: registration.feePerPerson,
        totalAmount: registration.totalAmount,
        registrationStatus: registration.registrationStatus,
        paymentStatus: registration.paymentStatus,
      },

      paymentDetails: {
        gcash: {
          accountName: event?.gcashAccountName ?? "",
          accountNumber: event?.gcashAccountNumber ?? "",
        },
        bankTransfer: {
          bankName: event?.bankName ?? "",
          accountName: event?.bankAccountName ?? "",
          accountNumber: event?.bankAccountNumber ?? "",
        },
      },

      latestPayment: latestPayment
        ? {
            paymentStatus: latestPayment.paymentStatus,
            paymentMethod: latestPayment.paymentMethod,
            createdAt: latestPayment.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Attendee payment lookup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve your payment information.",
      },
      { status: 500 }
    );
  }
}

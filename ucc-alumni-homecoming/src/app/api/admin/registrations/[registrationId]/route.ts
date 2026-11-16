
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import Registration from "@/models/Registration";
import Attendee from "@/models/Attendee";
import Payment from "@/models/Payment";
import { requireAdmin } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{
    registrationId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await requireAdmin(request);

    if (!admin.authorized) {
      return admin.response;
    }

    await connectDB();

    const { registrationId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid registration ID.",
        },
        { status: 400 }
      );
    }

    const registration = await Registration.findById(
      registrationId
    ).lean();

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          message: "Registration not found.",
        },
        { status: 404 }
      );
    }

    const [attendees, payments] = await Promise.all([
      Attendee.find({
        registrationId: registration._id,
      })
        .sort({ isPrimaryRegistrant: -1, fullName: 1 })
        .lean(),

      Payment.find({
        registrationId: registration._id,
      })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      registration,
      attendees,
      payments,
    });
  } catch (error) {
    console.error("Admin registration details error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve registration details.",
      },
      { status: 500 }
    );
  }
}

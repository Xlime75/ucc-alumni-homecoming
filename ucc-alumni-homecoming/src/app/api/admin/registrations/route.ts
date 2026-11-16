
import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Registration from "@/models/Registration";
import "@/models/Attendee";
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
    const status = searchParams.get("status") || "all";
    const paymentStatus = searchParams.get("paymentStatus") || "all";

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { registrationNumber: { $regex: search, $options: "i" } },
        { "primaryRegistrant.fullName": { $regex: search, $options: "i" } },
        { "primaryRegistrant.email": { $regex: search, $options: "i" } },
      ];
    }

    if (
      ["pending", "confirmed", "cancelled"].includes(status)
    ) {
      filter.registrationStatus = status;
    }

    if (
      ["pending", "partial", "paid", "overpaid", "refunded"].includes(
        paymentStatus
      )
    ) {
      filter.paymentStatus = paymentStatus;
    }

    const registrations = await Registration.find(filter)
      .sort({ registeredAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      total: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error("Admin registration retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve registrations.",
      },
      { status: 500 }
    );
  }
}

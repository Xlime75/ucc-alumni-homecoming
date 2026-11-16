
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";
import "@/models/Registration";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    // Verify administrator access.
    const admin = await requireAdmin();

    if (!admin.authorized) {
      return admin.response;
    }

    await connectDB();

    // Retrieve payments awaiting verification.
    const payments = await Payment.find({
      paymentStatus: "pending_verification",
    })
      .populate(
        "registrationId",
        "registrationNumber primaryRegistrant totalAttendees totalAmount"
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      total: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Admin payment retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve payment records.",
      },
      { status: 500 }
    );
  }
}

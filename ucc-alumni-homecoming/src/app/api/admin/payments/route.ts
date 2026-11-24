
import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";
import "@/models/Registration";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    // Verify administrator access.
    const admin = await requireAdmin(request);

    if (!admin.authorized) {
      return admin.response;
    }

    await connectDB();

    const payments = await Payment.find({
      paymentStatus: "pending_verification",
    })
      .populate(
        "registrationId",
        "registrationNumber primaryRegistrant totalAttendees totalAmount"
      )
      .sort({ createdAt: -1 })
      .lean();

    const safePayments = payments.map((payment) => ({
      _id: payment._id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      paymentStatus: payment.paymentStatus,
      createdAt: payment.createdAt,
      hasProof: Boolean(
        payment.proofOfPaymentPath || payment.proofOfPaymentUrl
      ),
      registrationId: payment.registrationId,
    }));

    return NextResponse.json({
      success: true,
      total: safePayments.length,
      payments: safePayments,
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

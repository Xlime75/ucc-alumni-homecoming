
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";

import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Registration from "@/models/Registration";
import { requireAdmin } from "@/lib/admin-auth";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

type RouteContext = {
  params: Promise<{
    paymentId: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  let session: mongoose.ClientSession | null = null;

  try {
    // Verify administrator access.
    const admin = await requireAdmin(request);

    if (!admin.authorized) {
      return admin.response;
    }

    await connectDB();

    const { paymentId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = reviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment review action.",
        },
        { status: 400 }
      );
    }

    const { action } = validation.data;

    session = await mongoose.startSession();
    session.startTransaction();

    const payment = await Payment.findOne({
      _id: paymentId,
      paymentStatus: "pending_verification",
    }).session(session);

    if (!payment) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message: "Payment not found or already reviewed.",
        },
        { status: 404 }
      );
    }

    const registration = await Registration.findById(
      payment.registrationId
    ).session(session);

    if (!registration) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message: "Associated registration not found.",
        },
        { status: 404 }
      );
    }

    if (registration.registrationStatus === "cancelled") {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message: "Cannot approve payment for a cancelled registration.",
        },
        { status: 409 }
      );
    }

    if (
      action === "approve" &&
      payment.amount !== registration.totalAmount
    ) {
      await session.abortTransaction();

      return NextResponse.json(
        {
          success: false,
          message: "Payment amount does not match the registration total.",
        },
        { status: 400 }
      );
    }

    payment.paymentStatus =
      action === "approve" ? "verified" : "rejected";

    payment.verifiedBy = admin.email;
    payment.verifiedAt = new Date();

    await payment.save({ session });

    if (action === "approve") {
      registration.paymentStatus = "paid";
      registration.registrationStatus = "confirmed";

      await registration.save({ session });
    }

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Payment approved successfully."
          : "Payment rejected successfully.",
      result: {
        paymentId: payment._id,
        paymentStatus: payment.paymentStatus,
        registrationNumber: registration.registrationNumber,
        registrationPaymentStatus: registration.paymentStatus,
        registrationStatus: registration.registrationStatus,
        reviewedBy: admin.email,
      },
    });
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Payment review API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process payment review.",
      },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

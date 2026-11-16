
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import connectDB from "@/lib/mongodb";
import Registration from "@/models/Registration";
import Payment from "@/models/Payment";

const paymentSchema = z.object({
  registrationNumber: z.string().trim().min(1),
  paymentMethod: z.enum(["gcash", "bank_transfer"]),
  amount: z.number().positive(),
  referenceNumber: z.string().trim().min(4),
  proofOfPaymentUrl: z.string().trim().url(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validation = paymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check your payment information.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      registrationNumber,
      paymentMethod,
      amount,
      referenceNumber,
      proofOfPaymentUrl,
    } = validation.data;
     
    const registration = await Registration.findOne({
      registrationNumber,
      registrationStatus: { $ne: "cancelled" },
    });

    if (!registration) {
      return NextResponse.json(
        {
          success: false,
          message: "Registration not found.",
        },
        { status: 404 }
      );
    }

    if (registration.paymentStatus === "paid") {
      return NextResponse.json(
        {
          success: false,
          message: "This registration has already been fully paid.",
        },
        { status: 409 }
      );
    }

    if (amount !== registration.totalAmount) {
  return NextResponse.json(
        {
         success: false,
         message: "Payment amount does not match the registration total.",
        },
        { status: 400 }
      );
    }

    const duplicateReference = await Payment.findOne({
        referenceNumber,
     });

    if (duplicateReference) {
    return NextResponse.json(
    {
      success: false,
      message: "This payment reference number has already been submitted.",
    },
    { status: 409 }
  );
}
    const existingPayment = await Payment.findOne({
      registrationId: registration._id,
      paymentStatus: { $in: ["pending", "pending_verification"] },
    });

    if (existingPayment) {
      return NextResponse.json(
        {
          success: false,
          message: "A payment is already awaiting verification.",
        },
        { status: 409 }
      );
    }

    const payment = await Payment.create({
      registrationId: registration._id,
      amount,
      paymentMethod,
      referenceNumber,
      proofOfPaymentUrl,
      paymentStatus: "pending_verification",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment submitted successfully. Awaiting admin verification.",
        payment: {
          paymentId: payment._id,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentStatus: payment.paymentStatus,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while submitting payment.",
      },
      { status: 500 }
    );
  }
}

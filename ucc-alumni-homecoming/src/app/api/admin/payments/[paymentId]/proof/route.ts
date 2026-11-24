
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { get } from "@vercel/blob";

import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { requireAdmin } from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{
    paymentId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Only authenticated administrators can view payment proofs.
    const admin = await requireAdmin(request);

    if (!admin.authorized) {
      return admin.response;
    }

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

    await connectDB();

    const payment = await Payment.findById(paymentId).select(
      "proofOfPaymentPath"
    );

    if (!payment || !payment.proofOfPaymentPath) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment proof not found.",
        },
        { status: 404 }
      );
    }

    // Retrieve the file directly from private Blob storage.
    const result = await get(payment.proofOfPaymentPath, {
      access: "private",
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to retrieve payment proof.",
        },
        { status: 404 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const contentType = result.blob.contentType;

    if (!contentType || !allowedTypes.includes(contentType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unsupported payment proof file type.",
        },
        { status: 415 }
      );
    }

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (error) {
    console.error("Payment proof retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve payment proof.",
      },
      { status: 500 }
    );
  }
}

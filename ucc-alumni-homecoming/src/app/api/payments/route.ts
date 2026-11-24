
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import { z } from "zod";

import connectDB from "@/lib/mongodb";
import Registration from "@/models/Registration";
import Payment from "@/models/Payment";

const paymentSchema = z.object({
  registrationNumber: z.string().trim().min(1).max(50),
  paymentMethod: z.enum(["gcash", "bank_transfer"]),
  referenceNumber: z.string().trim().min(4).max(100),
});

const MAX_FILE_SIZE = 4 * 1024 * 1024;

function identifyFile(bytes: Uint8Array) {
  // PDF
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return { mime: "application/pdf", extension: "pdf" };
  }

  // PNG
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: "image/png", extension: "png" };
  }

  // JPEG
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { mime: "image/jpeg", extension: "jpg" };
  }

  // WebP
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return { mime: "image/webp", extension: "webp" };
  }

  return null;
}

export async function POST(request: NextRequest) {
  let uploadedPath: string | null = null;

  try {
    // Authenticate the submitter.
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

    // Reject oversized requests before parsing the multipart body.
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > 4_500_000) {
      return NextResponse.json(
        {
          success: false,
          message: "The uploaded file must not exceed 4 MB.",
        },
        { status: 413 }
      );
    }

    const formData = await request.formData();

    const validation = paymentSchema.safeParse({
      registrationNumber: formData.get("registrationNumber"),
      paymentMethod: formData.get("paymentMethod"),
      referenceNumber: formData.get("referenceNumber"),
    });

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

    const proof = formData.get("proof");

    if (!(proof instanceof File) || proof.size === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please upload your proof of payment.",
        },
        { status: 400 }
      );
    }

    if (proof.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "The uploaded file must not exceed 4 MB.",
        },
        { status: 413 }
      );
    }

    const fileBytes = new Uint8Array(await proof.arrayBuffer());
    const fileType = identifyFile(fileBytes);

    if (!fileType) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPEG, PNG, WebP, and PDF files are allowed.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const {
      registrationNumber,
      paymentMethod,
      referenceNumber,
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

    // The signed-in Google account must match the registered email.
    const registeredEmail = String(
      registration.primaryRegistrant.email || ""
    )
      .trim()
      .toLowerCase();

    if (email !== registeredEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must sign in using the Google account associated with this registration.",
        },
        { status: 403 }
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

    // Generate a private storage path on the server.
    const pathname = `payment-proofs/${registration._id}/${randomUUID()}.${fileType.extension}`;

    const blob = await put(pathname, proof, {
      access: "private",
      addRandomSuffix: false,
      contentType: fileType.mime,
    });

    uploadedPath = blob.pathname;

    // The amount always comes from the database.
    const payment = await Payment.create({
      registrationId: registration._id,
      amount: registration.totalAmount,
      paymentMethod,
      referenceNumber,
      proofOfPaymentPath: blob.pathname,
      paymentStatus: "pending_verification",
    });

    uploadedPath = null;

    return NextResponse.json(
      {
        success: true,
        message:
          "Payment submitted successfully. Awaiting admin verification.",
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
    // Remove the uploaded proof if saving the payment failed.
    if (uploadedPath) {
      try {
        await del(uploadedPath);
      } catch (cleanupError) {
        console.error("Payment proof cleanup error:", cleanupError);
      }
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This payment reference number has already been submitted.",
        },
        { status: 409 }
      );
    }

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

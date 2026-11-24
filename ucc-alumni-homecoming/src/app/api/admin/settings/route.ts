
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";
import { requireAdmin } from "@/lib/admin-auth";

const settingsSchema = z
  .object({
    feePerPerson: z.number().positive().max(100000).optional(),

    registrationOpen: z.boolean().optional(),

    checkInEnabled: z.boolean().optional(),

    gcashAccountName: z.string().trim().max(100).optional(),

    gcashAccountNumber: z.string().trim().max(30).optional(),

    bankName: z.string().trim().max(100).optional(),

    bankAccountName: z.string().trim().max(100).optional(),

    bankAccountNumber: z.string().trim().max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one setting must be provided.",
  });

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    if (!admin.authorized) {
      return admin.response;
    }

    await connectDB();

    const event = await Event.findOne().lean();

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event settings not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        eventName: event.eventName,
        date: event.date,
        venue: event.venue,

        feePerPerson: event.feePerPerson,
        registrationOpen: event.registrationOpen,
        checkInEnabled: event.checkInEnabled,

        gcashAccountName: event.gcashAccountName ?? "",
        gcashAccountNumber: event.gcashAccountNumber ?? "",

        bankName: event.bankName ?? "",
        bankAccountName: event.bankAccountName ?? "",
        bankAccountNumber: event.bankAccountNumber ?? "",
      },
    });
  } catch (error) {
    console.error("Settings retrieval error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve event settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    if (!admin.authorized) {
      return admin.response;
    }

    const body = await request.json();
    const validation = settingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid settings.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findOneAndUpdate(
      {},
      { $set: validation.data },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event settings not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event settings updated successfully.",
      settings: {
        feePerPerson: event.feePerPerson,
        registrationOpen: event.registrationOpen,
        checkInEnabled: event.checkInEnabled,

        gcashAccountName: event.gcashAccountName ?? "",
        gcashAccountNumber: event.gcashAccountNumber ?? "",

        bankName: event.bankName ?? "",
        bankAccountName: event.bankAccountName ?? "",
        bankAccountNumber: event.bankAccountNumber ?? "",
      },
    });
  } catch (error) {
    console.error("Settings update error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update event settings." },
      { status: 500 }
    );
  }
}

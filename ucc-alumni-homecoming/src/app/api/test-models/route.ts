
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

import Event from "@/models/Event";
import Registration from "@/models/Registration";
import Attendee from "@/models/Attendee";
import Payment from "@/models/Payment";
import Attendance from "@/models/Attendance";

export async function GET() {
  try {
    await connectDB();

    const models = [
      Event.modelName,
      Registration.modelName,
      Attendee.modelName,
      Payment.modelName,
      Attendance.modelName,
    ];

    return NextResponse.json({
      success: true,
      message: "All five models loaded successfully!",
      models,
    });
  } catch (error) {
    console.error("Model validation failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Model validation failed. Check the terminal for details.",
      },
      { status: 500 }
    );
  }
}

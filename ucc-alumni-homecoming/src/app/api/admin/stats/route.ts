
import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Registration from "@/models/Registration";
import Attendee from "@/models/Attendee";
import Payment from "@/models/Payment";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const admin = await requireAdmin();

    if (!admin.authorized) {
      return admin.response;
    }

    await connectDB();

    const [
      totalRegistrations,
      totalAttendees,
      confirmedRegistrations,
      confirmedPayments,
      pendingPayments,
      expectedCollection,
      recentRegistrations,
    ] = await Promise.all([
      Registration.countDocuments(),

      Attendee.countDocuments(),

      Registration.countDocuments({
        registrationStatus: "confirmed",
      }),

      Payment.countDocuments({
        paymentStatus: {
          $in: ["verified", "paid_onsite"],
        },
      }),

      Payment.countDocuments({
        paymentStatus: "pending_verification",
      }),

      Registration.aggregate([
        {
          $match: {
            registrationStatus: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
          },
        },
      ]),

      Registration.find()
        .sort({ registeredAt: -1 })
        .limit(5)
        .select(
          "registrationNumber primaryRegistrant totalAttendees totalAmount registrationStatus paymentStatus registeredAt"
        )
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      statistics: {
        totalRegistrations,
        totalAttendees,
        confirmedRegistrations,
        confirmedPayments,
        pendingPayments,
        expectedCollection: expectedCollection[0]?.total || 0,
      },
      recentRegistrations,
    });
  } catch (error) {
    console.error("Admin dashboard statistics error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve dashboard statistics.",
      },
      { status: 500 }
    );
  }
}

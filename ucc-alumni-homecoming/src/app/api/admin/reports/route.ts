
import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Registration from "@/models/Registration";
import Attendee from "@/models/Attendee";
import Payment from "@/models/Payment";
import Attendance from "@/models/Attendance";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    if (!admin.authorized) {
      return admin.response;
    }

    await connectDB();

    const [
      totalRegistrations,
      pendingRegistrations,
      confirmedRegistrations,
      cancelledRegistrations,
      totalAttendees,
      totalCheckedIn,
      expectedCollection,
      paymentSummary,
    ] = await Promise.all([
      Registration.countDocuments(),

      Registration.countDocuments({
        registrationStatus: "pending",
      }),

      Registration.countDocuments({
        registrationStatus: "confirmed",
      }),

      Registration.countDocuments({
        registrationStatus: "cancelled",
      }),

      Attendee.countDocuments(),

      Attendance.countDocuments(),

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

      Payment.aggregate([
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const payments = {
      pending: 0,
      pendingVerification: 0,
      verified: 0,
      rejected: 0,
      paidOnsite: 0,
      refunded: 0,
    };

    let collectedAmount = 0;

    for (const item of paymentSummary) {
      switch (item._id) {
        case "pending":
          payments.pending = item.count;
          break;
        case "pending_verification":
          payments.pendingVerification = item.count;
          break;
        case "verified":
          payments.verified = item.count;
          collectedAmount += item.amount;
          break;
        case "rejected":
          payments.rejected = item.count;
          break;
        case "paid_onsite":
          payments.paidOnsite = item.count;
          collectedAmount += item.amount;
          break;
        case "refunded":
          payments.refunded = item.count;
          break;
      }
    }

    const expectedAmount = expectedCollection[0]?.total ?? 0;

    return NextResponse.json(
      {
        success: true,
        summary: {
          registrations: {
            total: totalRegistrations,
            pending: pendingRegistrations,
            confirmed: confirmedRegistrations,
            cancelled: cancelledRegistrations,
          },
          attendees: {
            total: totalAttendees,
            checkedIn: totalCheckedIn,
            notCheckedIn: Math.max(
              0,
              totalAttendees - totalCheckedIn
            ),
          },
          payments,
          finances: {
            expectedCollection: expectedAmount,
            collectedAmount,
            outstandingAmount: Math.max(
              0,
              expectedAmount - collectedAmount
            ),
          },
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Admin reports retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve reports.",
      },
      { status: 500 }
    );
  }
}

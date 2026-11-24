
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const mongoose = (await import("mongoose")).default;
  const { default: connectDB } = await import("../src/lib/mongodb");
  const { default: Event } = await import("../src/models/Event");
  const { default: Registration } = await import("../src/models/Registration");
  const { default: Attendee } = await import("../src/models/Attendee");
  const { default: Attendance } = await import("../src/models/Attendance");

  try {
    await connectDB();
    console.log("Connected to MongoDB Atlas.");

    const registrations = await Registration.find({
      registrationNumber: /^ATTENDANCE-TEST-/,
    }).select("_id");

    const registrationIds = registrations.map((r) => r._id);

    const attendeeRecords = await Attendee.find({
      registrationId: { $in: registrationIds },
    }).select("_id");

    const attendeeIds = attendeeRecords.map((a) => a._id);

    const attendanceResult = await Attendance.deleteMany({
      attendeeId: { $in: attendeeIds },
    });

    const attendeeResult = await Attendee.deleteMany({
      registrationId: { $in: registrationIds },
    });

    const registrationResult = await Registration.deleteMany({
      _id: { $in: registrationIds },
    });

    const event = await Event.findOne({
      eventName: "Alumni Homecoming 2027",
    });

    if (event) {
      event.checkInEnabled = false;
      await event.save();
    }

    console.log("\nCLEANUP SUCCESSFUL!");
    console.log("Attendance records deleted:", attendanceResult.deletedCount);
    console.log("Attendee records deleted:", attendeeResult.deletedCount);
    console.log("Test registrations deleted:", registrationResult.deletedCount);
    console.log("Online check-in restored to: DISABLED");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("CLEANUP FAILED:", error);
  process.exitCode = 1;
});


import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function cleanupCheckInTest() {
  const mongoose = await import("mongoose");
  const connectDB = (await import("../src/lib/mongodb")).default;
  const Event = (await import("../src/models/Event")).default;
  const Registration = (await import("../src/models/Registration")).default;
  const Attendee = (await import("../src/models/Attendee")).default;
  const Attendance = (await import("../src/models/Attendance")).default;

  const eventName = "Alumni Homecoming 2027";
  const registrationNumber = "CHECKIN-TEST-1795508119299";
  const testEmail = "asherdanieltibayan@gmail.com";

  try {
    await connectDB();
    console.log("Connected to MongoDB Atlas.");

    const registration = await Registration.findOne({
      registrationNumber,
      "primaryRegistrant.email": testEmail,
    });

    if (!registration) {
      throw new Error("The expected test registration was not found.");
    }

    const registrationId = registration._id;

    const attendanceResult = await Attendance.deleteMany({
      registrationId,
    });

    const attendeeResult = await Attendee.deleteMany({
      registrationId,
    });

    await Registration.deleteOne({
      _id: registrationId,
    });

    const event = await Event.findOne({ eventName });

    if (!event) {
      throw new Error("Event not found. Check-in setting was not restored.");
    }

    await Event.updateOne(
      { _id: event._id },
      { $set: { checkInEnabled: false } }
    );

    console.log("\nCLEANUP SUCCESSFUL!");
    console.log("Attendance records deleted:", attendanceResult.deletedCount);
    console.log("Attendee records deleted:", attendeeResult.deletedCount);
    console.log("Test registration deleted: 1");
    console.log("Online check-in restored to: DISABLED");

  } catch (error) {
    console.error("\nCLEANUP FAILED:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.default.disconnect();
  }
}

void cleanupCheckInTest();

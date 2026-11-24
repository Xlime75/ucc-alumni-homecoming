
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const mongoose = (await import("mongoose")).default;
  const { default: connectDB } = await import("../src/lib/mongodb");
  const { default: Event } = await import("../src/models/Event");
  const { default: Registration } = await import("../src/models/Registration");
  const { default: Attendee } = await import("../src/models/Attendee");

  try {
    await connectDB();
    console.log("Connected to MongoDB Atlas.");

    const event = await Event.findOne({
      eventName: "Alumni Homecoming 2027",
    });

    if (!event) {
      throw new Error("Event not found.");
    }

    const registrationNumber = `ATTENDANCE-TEST-${Date.now()}`;
    const testEmail = "asherdanieltibayan@gmail.com";

    const registration = await Registration.create({
      registrationNumber,
      primaryRegistrant: {
        attendeeType: "alumni",
        fullName: "Attendance Management Test",
        nickname: "Attendance Test",
        batchYear: "2020",
        schoolLevel: "high_school",
        birthday: new Date("2000-01-01"),
        currentAddress: "Test Address",
        email: testEmail,
        contactNumber: "09123456789",
        facebookProfile: "https://www.facebook.com/",
        work: "Test Occupation",
      },
      totalAttendees: 3,
      feePerPerson: event.feePerPerson,
      totalAmount: event.feePerPerson * 3,
      registrationStatus: "confirmed",
      paymentStatus: "paid",
      registeredAt: new Date(),
    });

    const attendees = await Attendee.insertMany([
      {
        registrationId: registration._id,
        fullName: "Attendance Management Test",
        email: testEmail,
        attendeeType: "alumni",
        isPrimaryRegistrant: true,
        attendanceStatus: "not_checked_in",
      },
      {
        registrationId: registration._id,
        fullName: "Attendance Test Companion One",
        attendeeType: "companion",
        isPrimaryRegistrant: false,
        attendanceStatus: "not_checked_in",
      },
      {
        registrationId: registration._id,
        fullName: "Attendance Test Companion Two",
        attendeeType: "companion",
        isPrimaryRegistrant: false,
        attendanceStatus: "not_checked_in",
      },
    ]);

    event.checkInEnabled = true;
    await event.save();

    console.log("\nTEST REGISTRATION CREATED!");
    console.log("Registration Number:", registrationNumber);
    console.log("Google Account:", testEmail);
    console.log("Total Attendees:", attendees.length);
    console.log("Total Amount:", `₱${registration.totalAmount}`);
    console.log("Registration Status:", registration.registrationStatus);
    console.log("Payment Status:", registration.paymentStatus);
    console.log("\nCheck-in temporarily ENABLED.");

    console.log("\nAttendee Names:");
    attendees.forEach((attendee) => {
      console.log(`- ${attendee.fullName}`);
    });
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("TEST SETUP FAILED:", error);
  process.exitCode = 1;
});

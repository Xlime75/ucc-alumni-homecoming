
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function testCheckInSetup() {
  const mongoose = await import("mongoose");
  const connectDB = (await import("../src/lib/mongodb")).default;
  const Event = (await import("../src/models/Event")).default;
  const Registration = (await import("../src/models/Registration")).default;
  const Attendee = (await import("../src/models/Attendee")).default;

  const eventName = "Alumni Homecoming 2027";
  const testEmail = "asherdanieltibayan@gmail.com";

  let originalCheckInEnabled = false;
  let eventSettingChanged = false;
  let registrationId: string | null = null;

  try {
    await connectDB();
    console.log("Connected to MongoDB Atlas.");

    const event = await Event.findOne({ eventName });

    if (!event) {
      throw new Error("Event not found.");
    }

    const existingRegistration = await Registration.findOne({
      "primaryRegistrant.email": testEmail,
      registrationStatus: { $in: ["pending", "confirmed"] },
    });

    if (existingRegistration) {
      throw new Error(
        "A registration already exists for your Google email. No test records were created."
      );
    }

    originalCheckInEnabled = event.checkInEnabled;

    const registrationNumber = `CHECKIN-TEST-${Date.now()}`;

    const registration = await Registration.create({
      registrationNumber,
      primaryRegistrant: {
        attendeeType: "alumni",
        fullName: "Check-in Test Registrant",
        nickname: "Test",
        batchYear: "2020",
        schoolLevel: "college",
        birthday: new Date("2000-01-15"),
        currentAddress: "Test Address",
        email: testEmail,
        contactNumber: "09171234567",
        facebookProfile: "https://www.facebook.com/test.registrant",
        work: "Software Developer",
      },
      totalAttendees: 3,
      feePerPerson: event.feePerPerson,
      totalAmount: event.feePerPerson * 3,
      registrationStatus: "confirmed",
      paymentStatus: "paid",
      registeredAt: new Date(),
    });

    registrationId = registration._id.toString();

    await Attendee.create([
      {
        registrationId: registration._id,
        fullName: "Check-in Test Registrant",
        email: testEmail,
        attendeeType: "alumni",
        isPrimaryRegistrant: true,
        attendanceStatus: "not_checked_in",
      },
      {
        registrationId: registration._id,
        fullName: "Check-in Test Companion One",
        attendeeType: "companion",
        isPrimaryRegistrant: false,
        attendanceStatus: "not_checked_in",
      },
      {
        registrationId: registration._id,
        fullName: "Check-in Test Companion Two",
        attendeeType: "companion",
        isPrimaryRegistrant: false,
        attendanceStatus: "not_checked_in",
      },
    ]);

    await Event.updateOne(
      { _id: event._id },
      { $set: { checkInEnabled: true } }
    );

    eventSettingChanged = true;

    console.log("\nTEST REGISTRATION CREATED!");
    console.log("Registration Number:", registrationNumber);
    console.log("Google Account:", testEmail);
    console.log("Attendees: 3");
    console.log("Total Amount:", `₱${event.feePerPerson * 3}`);
    console.log("Registration Status: confirmed");
    console.log("Payment Status: paid");
    console.log("Check-in temporarily enabled.");

    console.log("\nOpen: http://localhost:3000/check-in");
    console.log("\nKeep this test active until we finish testing.");

  } catch (error) {
    console.error("\nCHECK-IN SETUP FAILED:", error);

    if (registrationId) {
      await Attendee.deleteMany({ registrationId });
      await Registration.deleteOne({ _id: registrationId });
      console.log("Partially created test records cleaned up.");
    }

    process.exitCode = 1;
  } finally {
    await mongoose.default.disconnect();
  }
}

void testCheckInSetup();

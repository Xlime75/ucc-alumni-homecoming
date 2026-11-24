
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function createTestPaymentRegistration() {
  const mongoose = await import("mongoose");
  const connectDB = (await import("../src/lib/mongodb")).default;
  const Event = (await import("../src/models/Event")).default;
  const Registration = (await import("../src/models/Registration")).default;
  const Attendee = (await import("../src/models/Attendee")).default;

  const testEmail = "asherdanieltibayan@gmail.com";
  const registrationNumber = `UCC-2027-PAYTEST-${Date.now()}`;

  try {
    await connectDB();

    console.log("Connected to MongoDB Atlas.");

    const existing = await Registration.findOne({
      "primaryRegistrant.email": testEmail,
      registrationStatus: { $in: ["pending", "confirmed"] },
    });

    if (existing) {
      throw new Error(
        "An active registration already exists for this email. No test registration was created."
      );
    }

    const event = await Event.findOne({
      eventName: "Alumni Homecoming 2027",
    });

    if (!event) {
      throw new Error("Event not found.");
    }

    const fee = event.feePerPerson;
    const totalAttendees = 1;

    const registration = await Registration.create({
      registrationNumber,
      primaryRegistrant: {
        attendeeType: "alumni",
        fullName: "Asher Daniel Tibayan",
        nickname: "Asher",
        batchYear: "2027",
        schoolLevel: "college",
        birthday: new Date("2004-01-01"),
        currentAddress: "Test Address",
        email: testEmail,
        contactNumber: "09171234567",
        facebookProfile: "https://www.facebook.com/test.payment",
        work: "Student",
      },
      totalAttendees,
      feePerPerson: fee,
      totalAmount: fee * totalAttendees,
      registrationStatus: "pending",
      paymentStatus: "pending",
      registeredAt: new Date(),
    });

    await Attendee.create({
      registrationId: registration._id,
      fullName: "Asher Daniel Tibayan",
      email: testEmail,
      attendeeType: "alumni",
      isPrimaryRegistrant: true,
      attendanceStatus: "not_checked_in",
    });

    console.log("\nTEST REGISTRATION CREATED SUCCESSFULLY!");
    console.log("Registration Number:", registrationNumber);
    console.log("Email:", testEmail);
    console.log("Fee:", `₱${fee}`);
    console.log("Total Amount:", `₱${fee}`);
    console.log("\nRegistration status remains:", event.registrationOpen
      ? "OPEN (unchanged)"
      : "CLOSED (unchanged)");
    console.log("\nYou can now open http://localhost:3000/payment");
    console.log("Sign in using the Google account above.");
    console.log("\nKeep this registration until payment portal testing is finished.");
  } catch (error) {
    console.error("\nTEST REGISTRATION CREATION FAILED:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.default.disconnect();
  }
}

void createTestPaymentRegistration();

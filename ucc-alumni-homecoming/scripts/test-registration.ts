
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function testRegistration() {
  const mongoose = await import("mongoose");
  const connectDB = (await import("../src/lib/mongodb")).default;
  const Event = (await import("../src/models/Event")).default;
  const Registration = (await import("../src/models/Registration")).default;
  const Attendee = (await import("../src/models/Attendee")).default;

  const eventName = "Alumni Homecoming 2027";
  const testEmail = "api-test@example.com";

  let originalRegistrationOpen = false;
  let registrationNumber: string | undefined;

  try {
    await connectDB();

    console.log("Connected to MongoDB Atlas.");

    const event = await Event.findOne({ eventName });

    if (!event) {
      throw new Error("Event not found.");
    }

    originalRegistrationOpen = event.registrationOpen;

    // Temporarily enable registration for this test.
    await Event.updateOne(
      { _id: event._id },
      { $set: { registrationOpen: true } }
    );

    console.log("Registration temporarily enabled.");

    const response = await fetch(
      "http://localhost:3000/api/registrations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          primaryRegistrant: {
            fullName: "API Test User",
            email: testEmail,
            contactNumber: "09123456789",
            attendeeType: "alumni",
          },
          companions: [
            { fullName: "Test Companion One" },
            { fullName: "Test Companion Two" },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("HTTP Status:", response.status);
    console.log("API Response:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Registration test failed.");
    }

    registrationNumber = data.registration.registrationNumber;

    console.log("Registration successfully created!");
    console.log("Registration Number:", registrationNumber);
    console.log("Total Attendees:", data.registration.totalAttendees);
    console.log("Total Amount:", data.registration.totalAmount);

    if (
      data.registration.totalAttendees !== 3 ||
      data.registration.totalAmount !== 600
    ) {
      throw new Error("Registration totals do not match expectations.");
    }

  } catch (error) {
    console.error("REGISTRATION TEST FAILED:", error);
    process.exitCode = 1;

  } finally {
    // Always restore the original registration setting.
    await Event.updateOne(
      { eventName },
      { $set: { registrationOpen: originalRegistrationOpen } }
    );

    console.log("Registration setting restored.");

    // Remove the temporary test records.
    if (registrationNumber) {
      const testRegistration = await Registration.findOne({
        registrationNumber,
      });

      if (testRegistration) {
        await Attendee.deleteMany({
          registrationId: testRegistration._id,
        });

        await Registration.deleteOne({
          _id: testRegistration._id,
        });

        console.log("Temporary test records deleted.");
      }
    }

    await mongoose.default.disconnect();
  }
}

void testRegistration();

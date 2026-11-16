
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function testRegistration() {
  const mongoose = await import("mongoose");
  const connectDB = (await import("../src/lib/mongodb")).default;
  const Event = (await import("../src/models/Event")).default;
  const Registration = (await import("../src/models/Registration")).default;
  const Attendee = (await import("../src/models/Attendee")).default;

  const eventName = "Alumni Homecoming 2027";
  const testEmail = `api-test-${Date.now()}@example.com`;

  let originalRegistrationOpen = false;
  let registrationNumber: string | undefined;
  let eventSettingChanged = false;

  try {
    await connectDB();

    console.log("Connected to MongoDB Atlas.");

    const event = await Event.findOne({ eventName });

    if (!event) {
      throw new Error("Event not found.");
    }

    originalRegistrationOpen = event.registrationOpen;

    await Event.updateOne(
      { _id: event._id },
      { $set: { registrationOpen: true } }
    );

    eventSettingChanged = true;

    console.log("Registration temporarily enabled.");

    const registrationPayload = {
      primaryRegistrant: {
        fullName: "Test Former Principal",
        nickname: "Test",
        batchYear: "1995",
        schoolLevel: "college",
        birthday: "1975-05-15",
        currentAddress: "Test Address",
        contactNumber: "09171234567",
        email: testEmail,
        facebookProfile: "https://www.facebook.com/test.formerprincipal",
        work: "Retired",
        attendeeType: "former_principal",
      },
      companions: [
        { fullName: "Test Companion One" },
        { fullName: "Test Companion Two" },
      ],
    };

    // TEST 1: First registration should succeed.
    console.log("\nTEST 1: Submitting first registration...");

    const firstResponse = await fetch(
      "http://localhost:3000/api/registrations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationPayload),
      }
    );

    const firstData = await firstResponse.json();

    console.log("HTTP Status:", firstResponse.status);
    console.log("API Response:", firstData);

    if (!firstResponse.ok || !firstData.success) {
      throw new Error(
        firstData.message || "First registration should have succeeded."
      );
    }

    registrationNumber = firstData.registration.registrationNumber;

    if (
      firstData.registration.totalAttendees !== 3 ||
      firstData.registration.totalAmount !== 600
    ) {
      throw new Error("Registration totals do not match expectations.");
    }

    console.log("PASS: First registration successfully created.");
    console.log("Registration Number:", registrationNumber);

    // TEST 2: Duplicate email should be rejected.
    console.log("\nTEST 2: Submitting another registration with the same email...");

    const secondResponse = await fetch(
      "http://localhost:3000/api/registrations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationPayload),
      }
    );

    const secondData = await secondResponse.json();

    console.log("HTTP Status:", secondResponse.status);
    console.log("API Response:", secondData);

    if (secondResponse.status !== 409 || secondData.success !== false) {
      throw new Error(
        "Duplicate registration was not correctly rejected with HTTP 409."
      );
    }

    console.log("PASS: Duplicate email registration correctly rejected.");

    console.log("\nALL REGISTRATION TESTS PASSED!");

  } catch (error) {
    console.error("\nREGISTRATION TEST FAILED:", error);
    process.exitCode = 1;

  } finally {
    try {
      if (eventSettingChanged) {
        await Event.updateOne(
          { eventName },
          { $set: { registrationOpen: originalRegistrationOpen } }
        );

        console.log("Registration setting restored.");
      }

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
    } catch (cleanupError) {
      console.error("CLEANUP FAILED:", cleanupError);
      process.exitCode = 1;
    } finally {
      await mongoose.default.disconnect();
    }
  }
}

void testRegistration();

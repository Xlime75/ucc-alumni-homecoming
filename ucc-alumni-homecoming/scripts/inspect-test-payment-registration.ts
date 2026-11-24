
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function inspectTestRegistration() {
  const mongoose = await import("mongoose");
  const connectDB = (await import("../src/lib/mongodb")).default;
  const Registration = (await import("../src/models/Registration")).default;
  const Attendee = (await import("../src/models/Attendee")).default;
  const Payment = (await import("../src/models/Payment")).default;

  const registrationNumber = "UCC-2027-PAYTEST-1795516185849";

  try {
    await connectDB();

    const registration = await Registration.findOne({
      registrationNumber,
    });

    if (!registration) {
      console.log("Test registration not found. Nothing to clean up.");
      return;
    }

    const [attendees, payments] = await Promise.all([
      Attendee.find({ registrationId: registration._id }).lean(),
      Payment.find({ registrationId: registration._id }).lean(),
    ]);

    console.log("\nTEST REGISTRATION FOUND");
    console.log("Registration:", registration.registrationNumber);
    console.log("Email:", registration.primaryRegistrant.email);
    console.log("Registration ID:", registration._id.toString());

    console.log("\nRELATED RECORDS");
    console.log("Attendees:", attendees.length);
    console.log("Payments:", payments.length);

    console.log("\nPAYMENT DETAILS");
    for (const payment of payments) {
      console.log({
        id: payment._id.toString(),
        method: payment.paymentMethod,
        status: payment.paymentStatus,
        hasProofPath: Boolean(payment.proofOfPaymentPath),
      });
    }

    console.log("\nInspection only. No records were deleted.");
  } catch (error) {
    console.error("Inspection failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.default.disconnect();
  }
}

void inspectTestRegistration();

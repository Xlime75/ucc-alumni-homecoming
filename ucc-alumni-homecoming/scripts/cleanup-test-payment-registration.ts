
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function cleanupTestRegistration() {
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
      console.log("Test registration not found. Nothing to delete.");
      return;
    }

    const registrationId = registration._id;

    const paymentCount = await Payment.countDocuments({
      registrationId,
    });

    const attendeeCount = await Attendee.countDocuments({
      registrationId,
    });

    console.log("Verified target:", registration.registrationNumber);
    console.log("Payments to delete:", paymentCount);
    console.log("Attendees to delete:", attendeeCount);

    const paymentResult = await Payment.deleteMany({ registrationId });
    const attendeeResult = await Attendee.deleteMany({ registrationId });
    const registrationResult = await Registration.deleteOne({
      _id: registrationId,
      registrationNumber,
    });

    console.log("\nCLEANUP COMPLETED");
    console.log("Payments deleted:", paymentResult.deletedCount);
    console.log("Attendees deleted:", attendeeResult.deletedCount);
    console.log("Registrations deleted:", registrationResult.deletedCount);

    console.log(
      "\nPrivate Vercel Blob proof pathname was stored with the payment. " +
      "The database record is deleted, but the private Blob object may still exist."
    );
  } catch (error) {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.default.disconnect();
  }
}

void cleanupTestRegistration();


import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const connectDB = (await import("../src/lib/mongodb")).default;
  const Registration = (await import("../src/models/Registration")).default;
  const Payment = (await import("../src/models/Payment")).default;

  await connectDB();

  console.log("Connected to MongoDB Atlas.");

  const testRegistrationNumbers = [
    "TEST-APPROVE-1794744343308",
    "TEST-REJECT-1794744343308",
  ];

  const registrations = await Registration.find({
    registrationNumber: { $in: testRegistrationNumbers },
  });

  if (registrations.length !== 2) {
    throw new Error(
      `Expected 2 test registrations but found ${registrations.length}. No records were deleted.`
    );
  }

  const registrationIds = registrations.map(
    (registration) => registration._id
  );

  const payments = await Payment.find({
    registrationId: { $in: registrationIds },
  });

  if (
    payments.length !== 2 ||
    !payments.some((payment) => payment.paymentStatus === "verified") ||
    !payments.some((payment) => payment.paymentStatus === "rejected")
  ) {
    throw new Error(
      "Test payment verification failed. No records were deleted."
    );
  }

  const paymentResult = await Payment.deleteMany({
    registrationId: { $in: registrationIds },
  });

  const registrationResult = await Registration.deleteMany({
    _id: { $in: registrationIds },
  });

  console.log("\nCleanup completed successfully!");

  console.log("Payments deleted:", paymentResult.deletedCount);
  console.log("Registrations deleted:", registrationResult.deletedCount);

  console.log("\nOnly the two temporary test registrations were targeted.");
  
  const mongoose = (await import("mongoose")).default;
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Cleanup failed:", error);
  process.exit(1);
});

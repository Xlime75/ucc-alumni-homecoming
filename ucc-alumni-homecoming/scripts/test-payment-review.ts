
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const connectDB = (await import("../src/lib/mongodb")).default;
  const Registration = (await import("../src/models/Registration")).default;
  const Payment = (await import("../src/models/Payment")).default;

  await connectDB();

  console.log("Connected to MongoDB Atlas.");

  const testId = Date.now().toString();

    const testRegistrations: {
        _id: import("mongoose").Types.ObjectId;
        registrationNumber: string;
        totalAmount: number;
        paymentStatus: string;
    }[] = [];

   const testPayments: {
    _id: import("mongoose").Types.ObjectId;
    referenceNumber?: string;
     paymentStatus: string;
    }[] = [];

  try {
    // Create two temporary registrations.
    for (const label of ["APPROVE", "REJECT"]) {
      const registration = await Registration.create({
        registrationNumber: `TEST-${label}-${testId}`,
        primaryRegistrant: {
          fullName: `Test ${label} Registrant`,
          email: `test.${label.toLowerCase()}.${testId}@example.com`,
          contactNumber: "09123456789",
          attendeeType: "alumni",
        },
        totalAttendees: 1,
        feePerPerson: 200,
        totalAmount: 200,
        registrationStatus: "pending",
        paymentStatus: "pending",
      });

      testRegistrations.push(registration);

      const payment = await Payment.create({
        registrationId: registration._id,
        amount: 200,
        paymentMethod: "gcash",
        referenceNumber: `TEST-${label}-${testId}`,
        proofOfPaymentUrl: "https://example.com/test-proof",
        paymentStatus: "pending_verification",
      });

      testPayments.push(payment);

      console.log(`${label} test registration created.`);
    }

    console.log("\nTemporary test records created successfully.");

    console.log("\nTest registrations:");
    for (const registration of testRegistrations) {
      console.log({
        registrationNumber: registration.registrationNumber,
        totalAmount: registration.totalAmount,
        paymentStatus: registration.paymentStatus,
      });
    }

    console.log("\nTest payment IDs:");
    for (const payment of testPayments) {
      console.log({
        paymentId: payment._id.toString(),
        referenceNumber: payment.referenceNumber,
        paymentStatus: payment.paymentStatus,
      });
    }

    console.log(
      "\nIMPORTANT: Keep these records temporarily. We will use them to test the admin approval and rejection buttons."
    );
  } catch (error) {
    console.error("Test record creation failed:", error);

    // Clean up only records created by this script.
    const registrationIds = testRegistrations.map(
      (registration) => registration._id
    );

    if (registrationIds.length > 0) {
      await Payment.deleteMany({
        registrationId: { $in: registrationIds },
      });

      await Registration.deleteMany({
        _id: { $in: registrationIds },
      });
    }

    throw error;
  } finally {
    await import("mongoose").then(({ default: mongoose }) =>
      mongoose.disconnect()
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

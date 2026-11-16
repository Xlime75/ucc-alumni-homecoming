
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function testPaymentIndex() {
  const mongoose = await import("mongoose");
  const connectDB = (await import("../src/lib/mongodb")).default;
  const Payment = (await import("../src/models/Payment")).default;

  try {
    await connectDB();

    console.log("Connected to MongoDB Atlas.");

    // Ensure the Payment model indexes are created.
    await Payment.createIndexes();

    console.log("Payment indexes created successfully.");

    const indexes = await Payment.collection.indexes();

    const referenceIndex = indexes.find(
      (index) =>
        index.key.referenceNumber === 1 &&
        index.unique === true &&
        index.sparse === true
    );

    if (!referenceIndex) {
      throw new Error("Unique reference number index was not found.");
    }

    console.log("SUCCESS: Unique payment reference index verified!");
    console.log(referenceIndex);

  } catch (error) {
    console.error("PAYMENT INDEX TEST FAILED:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.default.disconnect();
  }
}

void testPaymentIndex();

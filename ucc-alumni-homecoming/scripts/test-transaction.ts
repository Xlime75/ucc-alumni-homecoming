
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function testTransaction() {
  const mongoose = await import("mongoose");
  const connectDB = (await import("../src/lib/mongodb")).default;
  const Event = (await import("../src/models/Event")).default;

  let session: InstanceType<typeof mongoose.default.mongo.ClientSession> | null =
    null;

  try {
    // Connect to MongoDB first.
    await connectDB();

    console.log("Connected to MongoDB Atlas.");

    // Start the session only after connecting.
    session = await mongoose.default.startSession();

    session.startTransaction();

    const event = await Event.findOne({
      eventName: "Alumni Homecoming 2027",
    }).session(session);

    if (!event) {
      throw new Error("Event not found.");
    }

    await session.abortTransaction();

    console.log("SUCCESS: MongoDB transaction test passed!");
    console.log("Event found:", event.eventName);
    console.log("No database records were changed.");
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("TRANSACTION TEST FAILED:", error);
    process.exitCode = 1;
  } finally {
    if (session) {
      await session.endSession();
    }

    await mongoose.default.disconnect();
  }
}

void testTransaction();


import { loadEnvConfig } from "@next/env";

// Load environment variables BEFORE importing mongodb.ts
loadEnvConfig(process.cwd());

async function seedEvent() {
  const mongoose = await import("mongoose");
  const connectDB = (await import("../src/lib/mongodb")).default;
  const Event = (await import("../src/models/Event")).default;

  try {
    await connectDB();

    const event = await Event.findOneAndUpdate(
      { eventName: "Alumni Homecoming 2027" },
      {
        $setOnInsert: {
        eventName: "Alumni Homecoming 2027",
        formerName: "Pagibig Unida School",
        date: new Date("2027-01-30T00:00:00+08:00"),
        venue: "UCC Gymnasium",
        theme: "Uniting Chapters through Christ",
        motto: "One Faith. One Pag-Ibig. One Unida!",
        registrationOpen: false,
        checkInEnabled: false,
      },
  $set: {
    feePerPerson: 200,
  },
},
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );

    console.log("Event initialized successfully!");
    console.log(event);
  } catch (error) {
    console.error("Event initialization failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.default.disconnect();
  }
}

void seedEvent();

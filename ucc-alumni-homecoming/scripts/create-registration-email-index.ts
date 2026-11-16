
import mongoose from "mongoose";
import connectDB from "../src/lib/mongodb";
import Registration from "../src/models/Registration";

async function inspectIndexes() {
  try {
    await connectDB();

    const indexes = await Registration.collection.indexes();

    console.log("\nREGISTRATION INDEXES:\n");
    console.log(JSON.stringify(indexes, null, 2));
  } catch (error) {
    console.error("Index inspection failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

inspectIndexes();

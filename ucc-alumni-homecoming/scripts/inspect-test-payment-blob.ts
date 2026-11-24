
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function inspectTestBlob() {
  const { list } = await import("@vercel/blob");

  const prefix =
    "payment-proofs/6b05671a4007fb22f72834be/";

  try {
    const result = await list({ prefix });

    console.log("Matching test payment proofs:", result.blobs.length);

    for (const blob of result.blobs) {
      console.log({
        pathname: blob.pathname,
        size: blob.size,
      });
    }

    console.log("\nInspection only. No files were deleted.");
  } catch (error) {
    console.error("Blob inspection failed:", error);
    process.exitCode = 1;
  }
}

void inspectTestBlob();

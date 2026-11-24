
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function cleanupTestBlob() {
  const { list, del } = await import("@vercel/blob");

  const prefix =
    "payment-proofs/6b05671a4007fb22f72834be/";

  const expectedPath =
    "payment-proofs/6b05671a4007fb22f72834be/1abbaf6b-7580-4c20-856c-1656725c44b7.jpg";

  try {
    const result = await list({ prefix });

    const target = result.blobs.filter(
      (blob) => blob.pathname === expectedPath
    );

    if (target.length !== 1) {
      throw new Error(
        `Expected exactly one matching proof, found ${target.length}. Nothing deleted.`
      );
    }

    await del(expectedPath);

    console.log("TEST PAYMENT PROOF DELETED SUCCESSFULLY!");
    console.log("Deleted pathname:", expectedPath);
    console.log("Other payment proofs were not touched.");
  } catch (error) {
    console.error("Blob cleanup failed:", error);
    process.exitCode = 1;
  }
}

void cleanupTestBlob();

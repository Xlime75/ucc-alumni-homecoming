
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function testRateLimit() {
  const { registrationRatelimit } = await import(
    "../src/lib/ratelimit"
  );

  const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;

  console.log("Testing rate limit...");
  console.log("Test IP:", testIp);

  for (let attempt = 1; attempt <= 6; attempt++) {
    const result = await registrationRatelimit.limit(testIp);

    console.log(
      `Attempt ${attempt}:`,
      result.success ? "ALLOWED" : "BLOCKED",
      `| Remaining: ${result.remaining}`
    );

    if (attempt <= 5 && !result.success) {
      throw new Error(`Attempt ${attempt} was unexpectedly blocked.`);
    }

    if (attempt === 6 && result.success) {
      throw new Error("The 6th attempt was not blocked.");
    }
  }

  console.log("SUCCESS: Rate limiter correctly blocked the 6th attempt!");
}

testRateLimit().catch((error) => {
  console.error("RATE LIMIT TEST FAILED:", error);
  process.exitCode = 1;
});

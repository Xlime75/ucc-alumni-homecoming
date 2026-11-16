
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function testRedis() {
  const { testRedisConnection } = await import("../src/lib/ratelimit");

  try {
    const result = await testRedisConnection();

    console.log("Upstash Redis connection:", result);

    if (result !== "PONG") {
      throw new Error("Unexpected Redis response.");
    }

    console.log("SUCCESS: Upstash Redis connection is working!");
  } catch (error) {
    console.error("REDIS CONNECTION FAILED:", error);
    process.exitCode = 1;
  }
}

void testRedis();

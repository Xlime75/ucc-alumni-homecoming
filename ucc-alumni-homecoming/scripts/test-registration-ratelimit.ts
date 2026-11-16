
const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;

async function testRegistrationRateLimit() {
  console.log("Testing registration API rate limit...");
  console.log("Test IP:", testIp);

  for (let attempt = 1; attempt <= 6; attempt++) {
    const response = await fetch(
      "http://localhost:3000/api/registrations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({}),
      }
    );

    const result = await response.json();

    console.log(
      `Attempt ${attempt}: HTTP ${response.status}`,
      `| ${result.message}`
    );

    if (attempt <= 5 && response.status !== 400) {
      throw new Error(
        `Expected HTTP 400 on attempt ${attempt}, got ${response.status}`
      );
    }

    if (attempt === 6 && response.status !== 429) {
      throw new Error(
        `Expected HTTP 429 on attempt 6, got ${response.status}`
      );
    }
  }

  console.log(
    "SUCCESS: Registration API correctly blocked the 6th attempt!"
  );
}

testRegistrationRateLimit().catch((error) => {
  console.error("TEST FAILED:", error);
  process.exitCode = 1;
});

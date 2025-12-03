import { check } from "k6";
import { DataHelper } from "../../../shared/helpers/DataHelper.js";
import { StructuredLogger } from "../../../shared/helpers/StructuredLogger.js";
import { RequestHelper } from "../../../shared/helpers/RequestHelper.js";

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  console.log("🧪 Starting Weighted Switch and Structured Logger Verification");

  // 1. Test weightedSwitch
  console.log("Testing DataHelper.weightedSwitch()...");

  let browseCount = 0;
  let cartCount = 0;
  let checkoutCount = 0;

  // Run 1000 iterations to verify distribution
  for (let i = 0; i < 1000; i++) {
    const action = DataHelper.weightedSwitch([
      [
        0.7,
        () => {
          browseCount++;
        },
      ],
      [
        0.2,
        () => {
          cartCount++;
        },
      ],
      [
        0.1,
        () => {
          checkoutCount++;
        },
      ],
    ]);
    action();
  }

  console.log(
    `Distribution: Browse=${browseCount}, Cart=${cartCount}, Checkout=${checkoutCount}`
  );

  check(
    { browseCount, cartCount, checkoutCount },
    {
      "weightedSwitch: browse ~70%": (counts) =>
        counts.browseCount > 650 && counts.browseCount < 750,
      "weightedSwitch: cart ~20%": (counts) =>
        counts.cartCount > 150 && counts.cartCount < 250,
      "weightedSwitch: checkout ~10%": (counts) =>
        counts.checkoutCount > 50 && counts.checkoutCount < 150,
    }
  );

  // 2. Test error handling for invalid weights
  console.log("Testing weightedSwitch error handling...");
  let errorThrown = false;
  try {
    DataHelper.weightedSwitch([
      [0.5, () => {}],
      [0.3, () => {}], // Sum is 0.8, not 1.0
    ]);
  } catch (e) {
    errorThrown = true;
  }

  check(
    { errorThrown },
    {
      "weightedSwitch: throws error for invalid weights": (state) =>
        state.errorThrown === true,
    }
  );

  // 3. Test StructuredLogger
  console.log("Testing StructuredLogger...");

  // Note: StructuredLogger only logs when K6_STRUCTURED_LOGS=true
  // We'll just verify it doesn't crash
  const request = new RequestHelper("https://httpbin.org");
  const response = request.get("/status/200");

  StructuredLogger.logRequest(
    "GET",
    "https://httpbin.org/status/200",
    response,
    {
      testName: "verification",
    }
  );

  StructuredLogger.logEvent("test_event", {
    action: "verification",
    value: 123,
  });

  StructuredLogger.logError("Test error", {
    context: "verification",
  });

  check(response, {
    "StructuredLogger: does not crash": (r) => r.status === 200,
  });

  console.log("✅ Weighted Switch and Structured Logger Verification Complete");
}

import { check } from "k6";
import { ExampleService } from "../lib/services/ExampleService.js";
import { ValidationHelper } from "../../../shared/helpers/ValidationHelper.js";

const config = JSON.parse(open("../config/default.json"));
const service = new ExampleService(config.baseUrl);

export const options = {
  scenarios: config.scenarios,
  thresholds: config.thresholds,
};

export default function () {
  // Example GET request
  const res = service.getExample("1");

  check(res, {
    "status is 200": (r) => ValidationHelper.hasStatus(r, 200),
    "response time < 500ms": (r) =>
      ValidationHelper.isResponseTimeLessThan(r, 500),
    "has valid structure": (r) =>
      ValidationHelper.hasJsonStructure(r, ["id", "name"]),
  });
}

import { getRequestTimeout } from "../../middleware/request-timeout";

describe("getRequestTimeout", () => {
  it("should return 60000 for POST /jobs", () => {
    expect(getRequestTimeout("/api/v1/jobs", "POST")).toBe(60000);
  });

  it("should return 45000 for GET /reports", () => {
    expect(getRequestTimeout("/api/v1/reports", "GET")).toBe(45000);
  });

  it("should return default timeout 30000 for other routes", () => {
    expect(getRequestTimeout("/api/v1/users", "GET")).toBe(30000);
    expect(getRequestTimeout("/api/v1/jobs", "GET")).toBe(30000); // jobs but not POST
    expect(getRequestTimeout("/api/v1/reports", "POST")).toBe(30000); // reports but not GET
  });
});

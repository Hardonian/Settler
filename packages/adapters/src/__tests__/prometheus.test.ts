import { trackApiCall, metrics } from "../metrics/prometheus";

describe("trackApiCall", () => {
  let incrementCounterSpy: jest.SpyInstance;
  let recordHistogramSpy: jest.SpyInstance;

  beforeEach(() => {
    metrics.reset();
    incrementCounterSpy = jest.spyOn(metrics, "incrementCounter");
    recordHistogramSpy = jest.spyOn(metrics, "recordHistogram");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("tracks successful API calls (200-299 status code)", () => {
    trackApiCall("test-connector", 200, 1500);

    expect(incrementCounterSpy).toHaveBeenCalledWith("settler_api_calls_total", {
      connector_id: "test-connector",
      status: "success",
    });

    expect(recordHistogramSpy).toHaveBeenCalledWith("settler_api_call_duration_seconds", 1.5, {
      connector_id: "test-connector",
    });

    trackApiCall("test-connector-2", 299, 500);
    expect(incrementCounterSpy).toHaveBeenCalledWith("settler_api_calls_total", {
      connector_id: "test-connector-2",
      status: "success",
    });
  });

  it("tracks error API calls (non-2xx status code)", () => {
    trackApiCall("test-connector", 400, 250);

    expect(incrementCounterSpy).toHaveBeenCalledWith("settler_api_calls_total", {
      connector_id: "test-connector",
      status: "error",
    });

    expect(recordHistogramSpy).toHaveBeenCalledWith("settler_api_call_duration_seconds", 0.25, {
      connector_id: "test-connector",
    });

    trackApiCall("test-connector-3", 500, 100);
    expect(incrementCounterSpy).toHaveBeenCalledWith("settler_api_calls_total", {
      connector_id: "test-connector-3",
      status: "error",
    });
  });
});

import { OssAlertRoutingProvider } from "../providers/alert-routing-provider";
import {
  checkAlertThresholds,
  upsertAlertThreshold,
  type AlertThreshold,
} from "../../operator-mode/alerting";

jest.mock("../../operator-mode/alerting", () => ({
  checkAlertThresholds: jest.fn(),
  upsertAlertThreshold: jest.fn(),
}));

describe("alert routing provider tenant scoping", () => {
  const checkAlertThresholdsMock = checkAlertThresholds as jest.MockedFunction<
    typeof checkAlertThresholds
  >;
  const upsertAlertThresholdMock = upsertAlertThreshold as jest.MockedFunction<
    typeof upsertAlertThreshold
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("forwards tenant context when checking thresholds", async () => {
    checkAlertThresholdsMock.mockResolvedValue([]);
    const provider = new OssAlertRoutingProvider();

    await provider.checkThresholds("11111111-1111-4111-8111-111111111111");

    expect(checkAlertThresholdsMock).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111");
  });

  it("forwards tenant ownership when creating thresholds", async () => {
    upsertAlertThresholdMock.mockResolvedValue("threshold-id");
    const provider = new OssAlertRoutingProvider();

    const threshold: AlertThreshold = {
      name: "failed ingestion",
      metric: "failed_ingestion",
      threshold: 1,
      operator: "gt",
      severity: "medium",
      channels: ["email"],
      enabled: true,
    };

    await provider.upsertThreshold("user-id", threshold, "22222222-2222-4222-8222-222222222222");

    expect(upsertAlertThresholdMock).toHaveBeenCalledWith(
      "user-id",
      threshold,
      "22222222-2222-4222-8222-222222222222"
    );
  });
});

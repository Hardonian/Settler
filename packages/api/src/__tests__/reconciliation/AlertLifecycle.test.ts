import { assertCanResolveAlert, AlertTransitionError } from "../../services/alerts/AlertLifecycle";

describe("AlertLifecycle", () => {
  it("allows resolve from open state", () => {
    expect(() => assertCanResolveAlert("open")).not.toThrow();
  });

  it("blocks resolve from resolved state", () => {
    expect(() => assertCanResolveAlert("resolved")).toThrow(AlertTransitionError);
  });
});

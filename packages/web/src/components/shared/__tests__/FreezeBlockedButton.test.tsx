import { fireEvent, render, screen } from "@testing-library/react";
import { FreezeBlockedButton } from "../FreezeBlockedButton";

describe("FreezeBlockedButton", () => {
  it("renders enabled when not frozen", () => {
    render(<FreezeBlockedButton isFrozen={false}>Retry run</FreezeBlockedButton>);

    expect(screen.getByRole("button", { name: /retry run/i })).toBeEnabled();
  });

  it("renders disabled when frozen", () => {
    render(
      <FreezeBlockedButton isFrozen={true} freezeReason="Maintenance window">
        Retry run
      </FreezeBlockedButton>
    );

    expect(screen.getByRole("button", { name: /retry run/i })).toBeDisabled();
  });

  it("shows the freeze tooltip copy on hover", () => {
    render(
      <FreezeBlockedButton
        isFrozen={true}
        freezeReason="Maintenance window"
        frozenMessage="Retry is blocked"
      >
        Retry run
      </FreezeBlockedButton>
    );

    const button = screen.getByRole("button", { name: /retry run/i });
    fireEvent.mouseEnter(button.parentElement as HTMLElement);

    expect(screen.getByText("Retry is blocked: Maintenance window")).toBeInTheDocument();
  });
});

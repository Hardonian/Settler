/**
 * FreezeErrorAlert Component Tests
 *
 * Tests for consistent freeze-blocked action error handling
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { FreezeErrorAlert, InlineFreezeError } from "../FreezeErrorAlert";

describe("FreezeErrorAlert", () => {
  it("should render freeze error with reason", () => {
    render(<FreezeErrorAlert reason="Emergency maintenance in progress" />);

    expect(screen.getByText("Action blocked by tenant freeze")).toBeInTheDocument();
    expect(screen.getByText(/Emergency maintenance in progress/)).toBeInTheDocument();
  });

  it("should display scope and timestamp when provided", () => {
    render(
      <FreezeErrorAlert reason="Compliance review" scope="tenant" frozenAt="2026-03-17T10:00:00Z" />
    );

    expect(screen.getByText(/Scope:/)).toBeInTheDocument();
    expect(screen.getByText(/tenant/)).toBeInTheDocument();
    expect(screen.getByText(/Frozen at:/)).toBeInTheDocument();
  });

  it("should render recovery action with link", () => {
    render(
      <FreezeErrorAlert
        reason="Incident response"
        recoveryAction={{
          label: "View Governance",
          href: "/console/governance",
        }}
      />
    );

    const link = screen.getByRole("link", { name: /View Governance/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/console/governance");
  });

  it("should render recovery action with onClick handler", () => {
    const handleClick = jest.fn();

    render(
      <FreezeErrorAlert
        reason="Test freeze"
        recoveryAction={{
          label: "Retry",
          onClick: handleClick,
        }}
      />
    );

    const button = screen.getByRole("button", { name: /Retry/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should render minimal version without card wrapper", () => {
    const { container } = render(<FreezeErrorAlert reason="Test" minimal={true} />);

    // Should not have Card component
    expect(container.querySelector('[class*="CardContent"]')).toBeNull();
    // Should have the minimal div wrapper
    expect(container.querySelector('[class*="bg-red-50"]')).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<FreezeErrorAlert reason="Test" className="custom-class" />);

    const card = container.firstChild;
    expect(card).toHaveClass("custom-class");
  });
});

describe("InlineFreezeError", () => {
  it("should render inline freeze message", () => {
    render(<InlineFreezeError reason="Custom reason" />);

    expect(screen.getByText("Custom reason")).toBeInTheDocument();
  });

  it("should show default message when no reason provided", () => {
    render(<InlineFreezeError />);

    expect(
      screen.getByText("This action is blocked while the tenant is frozen.")
    ).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<InlineFreezeError className="custom-inline" />);

    const div = container.firstChild;
    expect(div).toHaveClass("custom-inline");
  });
});

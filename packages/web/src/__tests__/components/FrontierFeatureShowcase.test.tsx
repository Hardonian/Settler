import { fireEvent, render, screen } from "@testing-library/react";
import { FrontierFeatureShowcase } from "@/components/site/FrontierFeatureShowcase";

describe("FrontierFeatureShowcase", () => {
  it("presents the time-travel capability first", () => {
    render(<FrontierFeatureShowcase />);

    expect(
      screen.getByRole("heading", { name: "Investigate financial state, not screenshots" })
    ).toBeInTheDocument();
    expect(screen.getByText("transfer_01842")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open workbench/i })).toHaveAttribute(
      "href",
      "/console/time-travel"
    );
  });

  it("switches the preview and destination with the selected capability", () => {
    render(<FrontierFeatureShowcase />);

    fireEvent.click(screen.getByRole("tab", { name: /Package the proof/i }));

    expect(screen.getByText("run-manifest.json")).toBeInTheDocument();
    expect(screen.getByText("Package integrity verified")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open workbench/i })).toHaveAttribute(
      "href",
      "/console/audit-dossier"
    );
  });
});

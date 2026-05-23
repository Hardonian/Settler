import { render } from "@testing-library/react";
import { StructuredData } from "../../components/StructuredData";

describe("StructuredData", () => {
  it("escapes HTML entities in JSON payload to prevent XSS", () => {
    const maliciousData = {
      name: "Malicious <script>alert(1)</script>",
      description: "</script><script>alert('xss')</script>",
    };

    const { container } = render(<StructuredData data={maliciousData} id="test-schema" />);
    const script = container.querySelector("#test-schema");

    expect(script).not.toBeNull();
    const content = script?.innerHTML;

    // Should contain unicode escapes instead of raw brackets
    expect(content).toContain("\\u003cscript\\u003ealert(1)\\u003c/script\\u003e");
    expect(content).toContain(
      "\\u003c/script\\u003e\\u003cscript\\u003ealert('xss')\\u003c/script\\u003e"
    );

    // Should NOT contain raw brackets
    expect(content).not.toContain("<script>");
    expect(content).not.toContain("</script>");
  });
});

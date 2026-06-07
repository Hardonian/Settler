import { StructuredData } from "../../components/StructuredData";

describe("StructuredData", () => {
  it("escapes HTML entities in JSON payload to prevent XSS", () => {
    const maliciousData = {
      name: "Malicious <script>alert(1)</script>",
      description: "</script><script>alert('xss')</script>&",
    };

    // Use pure function call to avoid ReactCurrentDispatcher errors
    const output = StructuredData({ data: maliciousData, id: "test-schema" });
    const content = output.props.dangerouslySetInnerHTML.__html;

    // Should contain unicode escapes instead of raw brackets
    expect(content).toContain("\\u003cscript\\u003ealert(1)\\u003c/script\\u003e");
    expect(content).toContain(
      "\\u003c/script\\u003e\\u003cscript\\u003ealert(\\u0027xss\\u0027)\\u003c/script\\u003e\\u0026"
    );

    // Should NOT contain raw brackets or unescaped elements
    expect(content).not.toContain("<script>");
    expect(content).not.toContain("</script>");
    expect(content).not.toContain("&");
    expect(content).not.toContain("'");
  });
});

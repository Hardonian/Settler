import { StructuredData } from "../../components/StructuredData";

describe("StructuredData", () => {
  it("escapes HTML entities in JSON payload to prevent XSS", () => {
    const maliciousData = {
      name: "Malicious <script>alert(1)</script>",
      description: "</script><script>alert('xss')</script> & extra' \u2028 \u2029",
    };

    // Call the component directly to avoid testing-library/react rendering issues
    const result = StructuredData({ data: maliciousData, id: "test-schema" });

    const content = result.props.dangerouslySetInnerHTML.__html;

    // Should contain unicode escapes instead of raw brackets and symbols
    expect(content).toContain("\\u003cscript\\u003ealert(1)\\u003c/script\\u003e");
    expect(content).toContain(
      "\\u003c/script\\u003e\\u003cscript\\u003ealert(\\u0027xss\\u0027)\\u003c/script\\u003e \\u0026 extra\\u0027 \\u2028 \\u2029"
    );

    // Should NOT contain raw dangerous characters
    expect(content).not.toContain("<script>");
    expect(content).not.toContain("</script>");
    expect(content).not.toContain("& extra");
    expect(content).not.toContain("'xss'");
  });
});

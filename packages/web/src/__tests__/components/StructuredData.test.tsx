import { render } from "@testing-library/react";
import { StructuredData } from "../../components/StructuredData";

describe("StructuredData component", () => {
  it("escapes malicious HTML tags in JSON data", () => {
    const maliciousData = {
      "@type": "Person",
      name: "</script><script>alert('xss')</script>",
    };

    const { container } = render(<StructuredData data={maliciousData} id="test-schema" />);
    const scriptTag = container.querySelector("script");

    expect(scriptTag).not.toBeNull();
    const innerHTML = scriptTag?.innerHTML || "";

    // Ensure < and > are correctly escaped to unicode
    expect(innerHTML).toContain(
      "\\u003c/script\\u003e\\u003cscript\\u003ealert('xss')\\u003c/script\\u003e"
    );

    // Ensure raw < and > are not present
    expect(innerHTML).not.toContain("<script>");
    expect(innerHTML).not.toContain("</script>");
  });
});

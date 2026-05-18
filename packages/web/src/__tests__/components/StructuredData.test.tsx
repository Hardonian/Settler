import { render } from "@testing-library/react";
import { StructuredData } from "../../components/StructuredData";
import React from "react";

describe("StructuredData", () => {
  it("escapes malicious characters to prevent XSS", () => {
    const maliciousData = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "</script><script>alert('XSS')</script>",
      description: "A & B > C",
    };

    const { container } = render(<StructuredData data={maliciousData} />);
    const scriptTag = container.querySelector("script");

    expect(scriptTag).not.toBeNull();
    const html = scriptTag?.innerHTML || "";

    // Check that there are no unescaped dangerous characters
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("</script>");
    expect(html).not.toContain("<");
    expect(html).not.toContain(">");
    expect(html).not.toContain("&");

    // Check that they are correctly escaped
    expect(html).toContain(
      "\\u003c/script\\u003e\\u003cscript\\u003ealert('XSS')\\u003c/script\\u003e"
    );
    expect(html).toContain("A \\u0026 B \\u003e C");
  });
});

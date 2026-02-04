import { sanitizeReportData } from "../../utils/xss-sanitize";

describe("sanitizeReportData", () => {
  it("sanitizes nested strings in objects and arrays", () => {
    const payload = {
      title: '<script>alert("x")</script>',
      rows: [
        { id: 1, label: "safe" },
        { id: 2, label: "<img src=x onerror=alert(1)>" },
      ],
    };

    const result = sanitizeReportData(payload) as {
      title: string;
      rows: Array<{ label: string }>;
    };

    expect(result.title).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;&#x2F;script&gt;");
    expect(result.rows[1]?.label).toBe("&lt;img src=x onerror=alert(1)&gt;");
  });
});

import { escapeRegExp } from "@/lib/utils/regex";
import { translate } from "@/lib/i18n";

describe("regex escaping for dynamic interpolation", () => {
  it("escapes regex metacharacters in dynamic tokens", () => {
    expect(escapeRegExp("a+b(c)?[d]\\e")).toBe("a\\+b\\(c\\)\\?\\[d\\]\\\\e");
  });

  it("does not allow regex-token injection in i18n placeholder replacement", () => {
    const translated = translate("forms.minLength", "en", {
      "min|.*": "0",
    });

    expect(translated).toBe("Must be at least {min} characters");
  });
});

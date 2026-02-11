import fs from "fs";
import path from "path";

const MONOREPO_CWD = "/workspace/Settler";
const WEB_PACKAGE_CWD = "/workspace/Settler/packages/web";

describe("getContentPage content directory resolution", () => {
  const warnMock = jest.fn();

  beforeEach(() => {
    jest.doMock("@/lib/utils/logger", () => ({
      appLogger: {
        warn: warnMock,
      },
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("resolves content pages from packages/web/content/pages when running at monorepo root", async () => {
    jest.spyOn(process, "cwd").mockReturnValue(MONOREPO_CWD);
    const existsSyncSpy = jest.spyOn(fs, "existsSync").mockImplementation((candidatePath) => {
      return String(candidatePath) === path.join(MONOREPO_CWD, "packages/web/content/pages");
    });

    const readFileSyncSpy = jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(
        `---\ntitle: Product\ndescription: Product description\n---\n\n# Product page content`
      );

    const { getContentPage } = await import("@/lib/content/pages");

    const page = getContentPage("product");

    expect(existsSyncSpy).toHaveBeenCalledWith(path.join(MONOREPO_CWD, "content/pages"));
    expect(existsSyncSpy).toHaveBeenCalledWith(
      path.join(MONOREPO_CWD, "packages/web/content/pages")
    );
    expect(readFileSyncSpy).toHaveBeenCalledWith(
      path.join(MONOREPO_CWD, "packages/web/content/pages", "product.mdx"),
      "utf8"
    );
    expect(page).toMatchObject({
      slug: "product",
      title: "Product",
      description: "Product description",
    });
  });

  it("resolves content pages from content/pages when running inside packages/web", async () => {
    jest.spyOn(process, "cwd").mockReturnValue(WEB_PACKAGE_CWD);
    const existsSyncSpy = jest.spyOn(fs, "existsSync").mockImplementation((candidatePath) => {
      return String(candidatePath) === path.join(WEB_PACKAGE_CWD, "content/pages");
    });

    const readFileSyncSpy = jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(
        `---\ntitle: Enterprise\ndescription: Enterprise description\n---\n\n# Enterprise content`
      );

    const { getContentPage } = await import("@/lib/content/pages");

    const page = getContentPage("enterprise");

    expect(existsSyncSpy).toHaveBeenCalledWith(path.join(WEB_PACKAGE_CWD, "content/pages"));
    expect(readFileSyncSpy).toHaveBeenCalledWith(
      path.join(WEB_PACKAGE_CWD, "content/pages", "enterprise.mdx"),
      "utf8"
    );
    expect(page).toMatchObject({
      slug: "enterprise",
      title: "Enterprise",
      description: "Enterprise description",
    });
  });

  it("logs a non-sensitive warning through structured logger if no content directory is found", async () => {
    jest.spyOn(process, "cwd").mockReturnValue(MONOREPO_CWD);
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("missing file");
    });

    const { getContentPage } = await import("@/lib/content/pages");

    expect(warnMock).toHaveBeenCalledWith(
      "Content pages directory not found. Static content routes may return not found responses.",
      {
        scope: "content-pages",
        cwd: MONOREPO_CWD,
      }
    );
    expect(getContentPage("product")).toBeNull();
  });
});

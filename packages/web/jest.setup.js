// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}

if (typeof global.Headers === "undefined") {
  global.Headers = class Headers {};
}
if (typeof global.Request === "undefined") {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === "string" ? input : input?.url || "";
      this.method = init.method || "GET";
      this.headers = init.headers || {};
    }
  };
}
if (typeof global.Response === "undefined") {
  global.Response = class Response {
    constructor(body = null, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = init.headers || {};
    }
    static json(body, init = {}) {
      return new global.Response(body, init);
    }
  };
}
if (typeof global.fetch === "undefined") {
  global.fetch = jest.fn(async () => new global.Response(null));
}

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: "/",
      query: {},
      asPath: "/",
    };
  },
  usePathname() {
    return "/";
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

// Suppress console errors in tests (optional, remove if you want to see them)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render") ||
        args[0].includes("Warning: validateDOMNesting") ||
        args[0].includes("Warning: useLayoutEffect does nothing on the server"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

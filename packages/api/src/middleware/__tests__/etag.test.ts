import { Request, Response } from "express";
import {
  etagMiddleware,
  generateETag,
  generateETagFromData,
  isETagMatch,
  normalizeETag,
} from "../etag";

describe("RFC 7232 ETag Middleware", () => {
  it("normalizes strong and weak ETags correctly", () => {
    expect(normalizeETag('"abc123"')).toBe("abc123");
    expect(normalizeETag('W/"abc123"')).toBe("abc123");
    expect(normalizeETag('w/"abc123"')).toBe("abc123");
    expect(normalizeETag('  W/"abc123"  ')).toBe("abc123");
  });

  it("evaluates wildcard and comma-separated If-None-Match headers", () => {
    const etag = '"deadbeef12345678"';
    expect(isETagMatch("*", etag)).toBe(true);
    expect(isETagMatch('"other", "deadbeef12345678"', etag)).toBe(true);
    expect(isETagMatch('W/"deadbeef12345678"', etag)).toBe(true);
    expect(isETagMatch('"unmatched"', etag)).toBe(false);
    expect(isETagMatch(undefined, etag)).toBe(false);
  });

  it("generates deterministic SHA-256 based ETags", () => {
    const tag1 = generateETag('{"tenant":"t_123","balance":5000}');
    const tag2 = generateETag('{"tenant":"t_123","balance":5000}');
    const tag3 = generateETag('{"tenant":"t_123","balance":5001}');

    expect(tag1).toBe(tag2);
    expect(tag1).not.toBe(tag3);
    expect(tag1.startsWith('"')).toBe(true);
    expect(tag1.endsWith('"')).toBe(true);
  });

  it("returns 304 Not Modified when If-None-Match matches response", () => {
    const data = { status: "settled", amount: 1000 };
    const expectedETag = generateETagFromData(data);

    const req = {
      method: "GET",
      headers: {
        "if-none-match": expectedETag,
      },
    } as unknown as Request;

    const setHeaderMock = jest.fn();
    const statusMock = jest.fn().mockReturnThis();
    const endMock = jest.fn();

    const res = {
      setHeader: setHeaderMock,
      status: statusMock,
      end: endMock,
      json: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    const next = jest.fn();

    etagMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();

    // Call res.json
    res.json(data);

    expect(setHeaderMock).toHaveBeenCalledWith("ETag", expectedETag);
    expect(statusMock).toHaveBeenCalledWith(304);
    expect(endMock).toHaveBeenCalled();
  });
});

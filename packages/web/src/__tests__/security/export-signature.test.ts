import { signExportPayload } from '@/lib/security/export-signature';

describe('export signature controls', () => {
  const original = process.env.EXPORT_SIGNING_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EXPORT_SIGNING_KEY;
    } else {
      process.env.EXPORT_SIGNING_KEY = original;
    }
  });

  it('requires signing key', () => {
    delete process.env.EXPORT_SIGNING_KEY;
    expect(() => signExportPayload('payload')).toThrow('EXPORT_SIGNING_KEY is required');
  });

  it('returns deterministic signature for same payload', () => {
    process.env.EXPORT_SIGNING_KEY = 'test-signing-key';

    const first = signExportPayload('export-data');
    const second = signExportPayload('export-data');

    expect(first.signature).toBe(second.signature);
    expect(first.algorithm).toBe('hmac-sha256');
  });
});

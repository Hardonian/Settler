import React from 'react';
import { render } from '@testing-library/react';
import { StructuredData } from '@/components/StructuredData';

describe('StructuredData', () => {
  it('should sanitize data to prevent XSS attacks', () => {
    const maliciousData = {
      test: '</script><script>alert(1)</script>',
    };

    const { container } = render(<StructuredData data={maliciousData} />);

    // Test that the script tag was rendered
    const scriptTag = container.querySelector('script');
    expect(scriptTag).toBeInTheDocument();

    // Check the actual HTML content
    const innerHTML = scriptTag?.innerHTML || '';

    // It should contain the sanitized sequence, NOT the raw script tags
    expect(innerHTML).toContain('\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e');
    expect(innerHTML).not.toContain('<script>');
  });
});

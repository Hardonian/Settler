import { renderToStaticMarkup } from 'react-dom/server';
import OfflinePage from '@/app/offline/page';

describe('offline page render harness', () => {
  it('renders in server prerender mode without event-handler leakage', () => {
    const html = renderToStaticMarkup(<OfflinePage />);

    expect(html).toContain("You&#x27;re Offline");
    expect(html).toContain('Try Again');
    expect(html).not.toContain('onClick=');
  });
});

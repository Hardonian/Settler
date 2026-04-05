import { renderToStaticMarkup } from 'react-dom/server';
import { InvestorDashboardContent } from '@/app/investor/reality/page';
import { getInvestorRealityData } from '@/lib/investor/reality-data';

jest.mock('@/lib/investor/reality-data', () => ({
  getInvestorRealityData: jest.fn(),
}));

const mockedGetInvestorRealityData = jest.mocked(getInvestorRealityData);

describe('/investor/reality fallback behavior', () => {
  beforeEach(() => {
    mockedGetInvestorRealityData.mockReset();
  });

  it('renders fallback banner and assumed metrics when live data is unavailable', async () => {
    mockedGetInvestorRealityData.mockResolvedValue(null);

    const markup = renderToStaticMarkup(await InvestorDashboardContent());

    expect(markup).toContain('Live metrics unavailable');
    expect(markup).toContain('Rendering fallback values because optional runtime services are unavailable in this environment.');
    expect(markup).toContain('$0');
    expect(markup).toContain('ASSUMED');
  });


  it('renders live metrics and hides fallback banner when data is available', async () => {
    mockedGetInvestorRealityData.mockResolvedValue({
      revenue: {
        mrr: 12345,
        mrr_growth: 5.2,
        active_subscriptions: 42,
        churn: 1.1,
        status: 'proven',
      },
      usage: {
        dau: 100,
        wau: 500,
        active_tenants: 12,
        status: 'proven',
      },
      reliability: { uptime_proxy: null, hard_500_count: 0, failure_events: 0 },
      risk_index: 0,
      evidence_index: 100,
      last_updated: '2025-01-01T00:00:00.000Z',
      week_start: '2024-12-30',
    });

    const markup = renderToStaticMarkup(await InvestorDashboardContent());

    expect(markup).not.toContain('Live metrics unavailable');
    expect(markup).toContain('$12,345');
    expect(markup).toContain('PROVEN');
  });

  it('renders fallback banner when live data fetch throws', async () => {
    mockedGetInvestorRealityData.mockRejectedValue(new Error('upstream unavailable'));

    const markup = renderToStaticMarkup(await InvestorDashboardContent());

    expect(markup).toContain('Live metrics unavailable');
    expect(markup).toContain('ASSUMED');
  });
});

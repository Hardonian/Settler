import { Adapter, NormalizedData, FetchOptions, ValidationResult } from "./base";

/**
 * TikTok Shop + TikTok Ads Adapter
 * Fetches order data from TikTok Shop and ad spend from TikTok Ads
 */
export class TikTokShopAdapter implements Adapter {
  name = "tiktok-shop";
  version = "1.0.0";

  async fetch(options: FetchOptions): Promise<NormalizedData[]> {
    const { config, dateRange } = options;
    const accessToken = config.accessToken as string;
    const appKey = config.appKey as string;
    const appSecret = config.appSecret as string;

    if (!accessToken || !appKey || !appSecret) {
      throw new Error("TikTok Shop access token, app key, and app secret are required");
    }

    const results: NormalizedData[] = [];

    // Fetch TikTok Shop orders
    try {
      const shopUrl = "https://open-api.tiktokglobalshop.com/order/orders/search";
      const shopBody: {
        app_key: string;
        access_token: string;
        timestamp: number;
        create_time_from?: number;
        create_time_to?: number;
      } = {
        app_key: appKey,
        access_token: accessToken,
        timestamp: Math.floor(Date.now() / 1000),
      };

      if (dateRange?.start && dateRange?.end) {
        shopBody.create_time_from = Math.floor(dateRange.start.getTime() / 1000);
        shopBody.create_time_to = Math.floor(dateRange.end.getTime() / 1000);
      }

      const shopResponse = await fetch(shopUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shopBody),
      });

      if (shopResponse.ok) {
        const shopData = await shopResponse.json();
        const orders = shopData.data?.order_list || [];
        results.push(...orders.map((order: unknown) => this.normalizeShopOrder(order)));
      }
    } catch (error) {
      console.error("Error fetching TikTok Shop orders:", error);
    }

    // Fetch TikTok Ads spend
    try {
      const adsUrl = "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/";
      const adsParams = new URLSearchParams({
        access_token: accessToken,
        advertiser_id: config.advertiserId as string,
        service_type: "AUCTION",
        report_type: "BASIC",
        data_level: "AUCTION_CAMPAIGN",
        dimensions: JSON.stringify(["campaign_id", "stat_time_day"]),
        metrics: JSON.stringify(["spend"]),
      });

      if (dateRange?.start && dateRange?.end) {
        adsParams.append("start_date", dateRange.start.toISOString().split("T")[0]);
        adsParams.append("end_date", dateRange.end.toISOString().split("T")[0]);
      }

      const adsResponse = await fetch(`${adsUrl}?${adsParams.toString()}`);
      if (adsResponse.ok) {
        const adsData = await adsResponse.json();
        const reports = adsData.data?.list || [];
        results.push(...reports.map((report: unknown) => this.normalizeAdsSpend(report)));
      }
    } catch (error) {
      console.error("Error fetching TikTok Ads spend:", error);
    }

    return results;
  }

  normalizeShopOrder(data: unknown): NormalizedData {
    const order = data as {
      order_id: string;
      total_amount: {
        amount: string;
        currency: string;
      };
      create_time: number;
      order_status: number;
    };

    return {
      id: `tiktok_shop_${order.order_id}`,
      amount: parseFloat(order.total_amount.amount),
      currency: order.total_amount.currency.toUpperCase(),
      date: new Date(order.create_time * 1000),
      metadata: {
        order_id: order.order_id,
        order_status: order.order_status,
        source: "tiktok_shop",
      },
      sourceId: order.order_id,
      referenceId: order.order_id,
    };
  }

  normalizeAdsSpend(data: unknown): NormalizedData {
    const report = data as {
      metrics: {
        spend: string;
      };
      dimensions: {
        stat_time_day: string;
        campaign_id: string;
      };
    };

    return {
      id: `tiktok_ads_${report.dimensions.campaign_id}_${report.dimensions.stat_time_day}`,
      amount: parseFloat(report.metrics.spend),
      currency: "USD",
      date: new Date(report.dimensions.stat_time_day),
      metadata: {
        campaign_id: report.dimensions.campaign_id,
        source: "tiktok_ads",
        type: "ad_spend",
      },
      sourceId: report.dimensions.campaign_id,
    };
  }

  normalize(data: unknown): NormalizedData {
    const item = data as {
      id: string;
      amount: number;
      currency: string;
      date: string;
    };

    return {
      id: item.id,
      amount: item.amount,
      currency: item.currency.toUpperCase(),
      date: new Date(item.date),
      metadata: {},
      sourceId: item.id,
    };
  }

  validate(data: NormalizedData): ValidationResult {
    const errors: string[] = [];

    if (!data.id) {
      errors.push("ID is required");
    }
    if (data.amount <= 0) {
      errors.push("Amount must be greater than 0");
    }
    if (!data.currency) {
      errors.push("Currency is required");
    }
    if (!data.date) {
      errors.push("Date is required");
    }

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }
}

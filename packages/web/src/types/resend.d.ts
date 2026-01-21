declare module "resend" {
  export class Resend {
    constructor(apiKey?: string);
    emails: {
      send(data: {
        from: string;
        to: string | string[];
        subject: string;
        html?: string;
        text?: string;
        tags?: Array<{ name: string; value: string }>;
      }): Promise<{ data?: { id: string } | null; error?: unknown }>;
    };
  }
}

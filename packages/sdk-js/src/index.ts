export class Settler {
  private apiKey: string;

  constructor(options: { apiKey: string }) {
    this.apiKey = options.apiKey;
  }

  public runs = {
    create: async (params: any) => {
      // Implementation stub
      return { id: "run_123", status: "pending" };
    },
  };
}

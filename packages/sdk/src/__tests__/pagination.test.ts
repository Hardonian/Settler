import {
  PaginatedIterator,
  createPaginatedIterator,
  collectPaginated,
  PaginatedResponse,
  PaginationOptions,
} from "../utils/pagination";

describe("SDK Paginated Async Iterator Utilities", () => {
  interface TestItem {
    id: string;
    amountCents: number;
  }

  it("iterates seamlessly across multiple pages using cursors", async () => {
    const mockDatabase: TestItem[] = [
      { id: "item-1", amountCents: 1000 },
      { id: "item-2", amountCents: 2000 },
      { id: "item-3", amountCents: 3000 },
      { id: "item-4", amountCents: 4000 },
      { id: "item-5", amountCents: 5000 },
    ];

    const fetchPage = async (options: PaginationOptions): Promise<PaginatedResponse<TestItem>> => {
      const startIndex = options.cursor ? parseInt(options.cursor, 10) : 0;
      const pageSize = 2;
      const items = mockDatabase.slice(startIndex, startIndex + pageSize);
      const nextIndex = startIndex + pageSize;
      const hasMore = nextIndex < mockDatabase.length;

      return {
        data: items,
        count: mockDatabase.length,
        nextCursor: hasMore ? String(nextIndex) : undefined,
        hasMore,
      };
    };

    const iterator = createPaginatedIterator(fetchPage);
    const collected: TestItem[] = [];

    for await (const item of iterator) {
      collected.push(item);
    }

    expect(collected).toHaveLength(5);
    expect(collected.map((i) => i.id)).toEqual(["item-1", "item-2", "item-3", "item-4", "item-5"]);
  });

  it("handles empty pages immediately returning done", async () => {
    const fetchEmpty = async (): Promise<PaginatedResponse<TestItem>> => ({
      data: [],
      count: 0,
      hasMore: false,
    });

    const iterator = new PaginatedIterator(fetchEmpty);
    const first = await iterator.next();

    expect(first.done).toBe(true);
    expect(first.value).toBeUndefined();
  });

  it("collects all items into array using collectAll utility", async () => {
    const fetchSinglePage = async (): Promise<PaginatedResponse<TestItem>> => ({
      data: [
        { id: "single-1", amountCents: 500 },
        { id: "single-2", amountCents: 750 },
      ],
      count: 2,
      hasMore: false,
    });

    const iterator = createPaginatedIterator(fetchSinglePage);
    const allItems = await collectPaginated(iterator);

    expect(allItems).toHaveLength(2);
    expect(allItems[0]!.id).toBe("single-1");
  });
});

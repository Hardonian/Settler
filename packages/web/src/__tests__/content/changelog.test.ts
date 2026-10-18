import { getAllChangelogPosts, getChangelogPost } from "../../lib/changelog";

describe("Changelog Content Engine", () => {
  it("loads changelog posts sorted in descending chronological order", () => {
    const posts = getAllChangelogPosts();
    expect(posts.length).toBeGreaterThan(0);

    // Latest post should be the October 2026 release
    const latest = posts[0];
    expect(latest.date).toBe("2026-10-18");
    expect(latest.title).toContain("Settler Autonomous Sovereign Frontier");
    expect(latest.slug).toBe("2026-10-18-settler-autonomous-frontier");
    expect(latest.content).toContain("Autonomous Real-Time ERP General Ledger Sync");
  });

  it("retrieves a single changelog post by slug", () => {
    const post = getChangelogPost("2026-10-18-settler-autonomous-frontier");
    expect(post).not.toBeNull();
    expect(post?.title).toContain("Settler Autonomous Sovereign Frontier");
    expect(post?.author).toBe("Settler Engineering");
  });

  it("returns null for non-existent post", () => {
    const post = getChangelogPost("non-existent-post-999");
    expect(post).toBeNull();
  });
});

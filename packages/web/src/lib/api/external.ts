/**
 * External API Integrations
 *
 * Fetches real data from GitHub and NPM APIs.
 * Returns zeroed-out values when APIs are unavailable — no fake placeholder numbers.
 */

export interface GitHubRepoStats {
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  lastUpdated: string;
  unavailable?: boolean;
}

export interface NPMStats {
  downloads: number;
  version: string;
  lastUpdated: string;
  unavailable?: boolean;
}

export interface ExternalMetrics {
  github: GitHubRepoStats;
  npm: NPMStats;
  timestamp: string;
}

/**
 * Fetch GitHub repository statistics.
 * Returns unavailable=true with zero counts when the API cannot be reached.
 */
export async function getGitHubStats(
  owner: string = "Hardonian",
  repo: string = "Settler"
): Promise<GitHubRepoStats> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      watchers: data.watchers_count || 0,
      openIssues: data.open_issues_count || 0,
      lastUpdated: data.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.warn("GitHub API unavailable:", error);
    return {
      stars: 0,
      forks: 0,
      watchers: 0,
      openIssues: 0,
      lastUpdated: new Date().toISOString(),
      unavailable: true,
    };
  }
}

/**
 * Fetch NPM package download statistics.
 * Returns unavailable=true with zero counts when the registry cannot be reached.
 */
export async function getNPMStats(packageName: string = "@settler/sdk"): Promise<NPMStats> {
  try {
    const packageResponse = await fetch(`https://registry.npmjs.org/${packageName}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!packageResponse.ok) {
      throw new Error(`NPM API error: ${packageResponse.status}`);
    }

    const packageData = await packageResponse.json();
    const latestVersion = packageData["dist-tags"]?.latest || "0.0.0";
    const lastModified = packageData.time?.modified || new Date().toISOString();

    return {
      downloads: 0, // NPM public API does not surface download counts without auth
      version: latestVersion,
      lastUpdated: lastModified,
    };
  } catch (error) {
    console.warn("NPM API unavailable:", error);
    return {
      downloads: 0,
      version: "unavailable",
      lastUpdated: new Date().toISOString(),
      unavailable: true,
    };
  }
}

/**
 * Get combined external metrics
 * Aggregates data from multiple sources for dashboard display
 */
export async function getExternalMetrics(): Promise<ExternalMetrics> {
  const [githubStats, npmStats] = await Promise.all([getGitHubStats(), getNPMStats()]);

  return {
    github: githubStats,
    npm: npmStats,
    timestamp: new Date().toISOString(),
  };
}

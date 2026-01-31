using Settler.Sdk.Models;

namespace Settler.Sdk;

/// <summary>Client for reconciliation job operations.</summary>
public sealed class JobsClient
{
    private readonly SettlerClient _client;

    internal JobsClient(SettlerClient client) => _client = client;

    /// <summary>Create a new reconciliation job.</summary>
    public async Task<DataResponse<Job>> CreateAsync(CreateJobRequest request, CancellationToken cancellationToken = default)
    {
        return await _client.RequestAsync<DataResponse<Job>>(
            HttpMethod.Post, "jobs", body: request, cancellationToken: cancellationToken);
    }

    /// <summary>List reconciliation jobs.</summary>
    public async Task<PaginatedResponse<Job>> ListAsync(
        int? page = null, int? limit = null, string? status = null, string? provider = null,
        CancellationToken cancellationToken = default)
    {
        var query = new Dictionary<string, string>();
        if (page.HasValue) query["page"] = page.Value.ToString();
        if (limit.HasValue) query["limit"] = limit.Value.ToString();
        if (status != null) query["status"] = status;
        if (provider != null) query["provider"] = provider;

        return await _client.RequestAsync<PaginatedResponse<Job>>(
            HttpMethod.Get, "jobs", query: query, cancellationToken: cancellationToken);
    }

    /// <summary>Get a job by ID.</summary>
    public async Task<DataResponse<Job>> GetAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _client.RequestAsync<DataResponse<Job>>(
            HttpMethod.Get, $"jobs/{Uri.EscapeDataString(id)}", cancellationToken: cancellationToken);
    }

    /// <summary>Run a reconciliation job.</summary>
    public async Task<DataResponse<Job>> RunAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _client.RequestAsync<DataResponse<Job>>(
            HttpMethod.Post, $"jobs/{Uri.EscapeDataString(id)}/run", cancellationToken: cancellationToken);
    }

    /// <summary>Delete a reconciliation job.</summary>
    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        await _client.RequestAsync(
            HttpMethod.Delete, $"jobs/{Uri.EscapeDataString(id)}", cancellationToken: cancellationToken);
    }
}

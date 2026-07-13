using Settler.Sdk.Models;

namespace Settler.Sdk;

/// <summary>Client for adapters operations.</summary>
public sealed class AdaptersClient
{
    private readonly SettlerClient _client;

    internal AdaptersClient(SettlerClient client) => _client = client;

    /// <summary>List available adapters.</summary>
    public async Task<DataResponse<List<Adapter>>> ListAsync(
        CancellationToken cancellationToken = default)
    {
        return await _client.RequestAsync<DataResponse<List<Adapter>>>(
            HttpMethod.Get, "adapters", cancellationToken: cancellationToken);
    }
}

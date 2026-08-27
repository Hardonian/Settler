using Settler.Sdk.Models;

namespace Settler.Sdk;

/// <summary>Client for console operations.</summary>
public sealed class ConsoleClient
{
    private readonly SettlerClient _client;

    internal ConsoleClient(SettlerClient client) => _client = client;

    /// <summary>Generate an API key for the console.</summary>
    public async Task<DataResponse<ApiKey>> GenerateApiKeyAsync(
        string name, CancellationToken cancellationToken = default)
    {
        var body = new Dictionary<string, object>
        {
            ["name"] = name,
        };

        return await _client.RequestAsync<DataResponse<ApiKey>>(
            HttpMethod.Post, "console/api-keys", body: body, cancellationToken: cancellationToken);
    }
}

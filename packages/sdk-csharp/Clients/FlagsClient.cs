using Settler.Sdk.Models;

namespace Settler.Sdk;

/// <summary>Client for feature flags operations.</summary>
public sealed class FlagsClient
{
    private readonly SettlerClient _client;

    internal FlagsClient(SettlerClient client) => _client = client;

    /// <summary>Evaluate a feature flag.</summary>
    public async Task<DataResponse<FlagEvaluation>> EvaluateAsync(
        string flagKey, Dictionary<string, object>? context = null,
        CancellationToken cancellationToken = default)
    {
        var body = new Dictionary<string, object>
        {
            ["flagKey"] = flagKey,
            ["context"] = context ?? new Dictionary<string, object>(),
        };

        return await _client.RequestAsync<DataResponse<FlagEvaluation>>(
            HttpMethod.Post, "flags/evaluate", body: body, cancellationToken: cancellationToken);
    }
}

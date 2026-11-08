namespace Settler.Sdk;

/// <summary>Client for cryptographic audit proofs and zero-knowledge verification.</summary>
public sealed class ProofsClient
{
    private readonly SettlerClient _client;

    internal ProofsClient(SettlerClient client) => _client = client;

    /// <summary>Verify an RFC 6962 proofpack or SMT inclusion proof.</summary>
    public async Task<Dictionary<string, object>> VerifyAsync(
        object proofpack, CancellationToken cancellationToken = default)
    {
        return await _client.RequestAsync<Dictionary<string, object>>(
            HttpMethod.Post, "zkp/verify", body: proofpack, cancellationToken: cancellationToken);
    }

    /// <summary>Execute deterministic Monetary Unit Sampling (MUS) with Merkle manifest.</summary>
    public async Task<Dictionary<string, object>> AuditSamplingAsync(
        IEnumerable<object> population, int? sampleSize = null, string? seed = null, CancellationToken cancellationToken = default)
    {
        var body = new Dictionary<string, object>
        {
            ["population"] = population,
        };
        if (sampleSize.HasValue)
        {
            body["sampleSize"] = sampleSize.Value;
        }
        if (!string.IsNullOrEmpty(seed))
        {
            body["seed"] = seed;
        }

        return await _client.RequestAsync<Dictionary<string, object>>(
            HttpMethod.Post, "auditor/samples", body: body, cancellationToken: cancellationToken);
    }
}

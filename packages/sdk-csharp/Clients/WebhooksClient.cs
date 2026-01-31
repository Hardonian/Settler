using Settler.Sdk.Models;

namespace Settler.Sdk;

/// <summary>Client for webhook operations.</summary>
public sealed class WebhooksClient
{
    private readonly SettlerClient _client;

    internal WebhooksClient(SettlerClient client) => _client = client;

    /// <summary>Send a webhook payload for processing.</summary>
    public async Task<DataResponse<WebhookResult>> ReceiveAsync(
        string adapter, object payload, CancellationToken cancellationToken = default)
    {
        return await _client.RequestAsync<DataResponse<WebhookResult>>(
            HttpMethod.Post, $"webhooks/receive/{Uri.EscapeDataString(adapter)}",
            body: payload, cancellationToken: cancellationToken);
    }
}

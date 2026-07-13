using Settler.Sdk.Models;

namespace Settler.Sdk;

/// <summary>Client for receipts operations.</summary>
public sealed class ReceiptsClient
{
    private readonly SettlerClient _client;

    internal ReceiptsClient(SettlerClient client) => _client = client;

    /// <summary>Upload a receipt.</summary>
    public async Task<DataResponse<Receipt>> UploadAsync(
        string fileBase64, string fileName, string contentType,
        CancellationToken cancellationToken = default)
    {
        var body = new Dictionary<string, object>
        {
            ["file"] = fileBase64,
            ["fileName"] = fileName,
            ["contentType"] = contentType,
        };

        return await _client.RequestAsync<DataResponse<Receipt>>(
            HttpMethod.Post, "receipts/upload", body: body, cancellationToken: cancellationToken);
    }
}

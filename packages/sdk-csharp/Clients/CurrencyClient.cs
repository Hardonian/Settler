using Settler.Sdk.Models;

namespace Settler.Sdk;

/// <summary>Client for currency and FX operations.</summary>
public sealed class CurrencyClient
{
    private readonly SettlerClient _client;

    internal CurrencyClient(SettlerClient client) => _client = client;

    /// <summary>Convert an amount to a target currency.</summary>
    public async Task<DataResponse<ConversionResult>> ConvertAsync(
        decimal value, string fromCurrency, string toCurrency, string? date = null,
        CancellationToken cancellationToken = default)
    {
        var body = new Dictionary<string, object>
        {
            ["amount"] = new { value, currency = fromCurrency },
            ["toCurrency"] = toCurrency,
        };
        if (date != null) body["date"] = date;

        return await _client.RequestAsync<DataResponse<ConversionResult>>(
            HttpMethod.Post, "currency/convert", body: body, cancellationToken: cancellationToken);
    }

    /// <summary>Get the FX rate for a currency pair.</summary>
    public async Task<DataResponse<FxRateResult>> GetFxRateAsync(
        string fromCurrency, string toCurrency, string? date = null,
        CancellationToken cancellationToken = default)
    {
        var query = new Dictionary<string, string>
        {
            ["fromCurrency"] = fromCurrency,
            ["toCurrency"] = toCurrency,
        };
        if (date != null) query["date"] = date;

        return await _client.RequestAsync<DataResponse<FxRateResult>>(
            HttpMethod.Get, "currency/fx-rate", query: query, cancellationToken: cancellationToken);
    }
}

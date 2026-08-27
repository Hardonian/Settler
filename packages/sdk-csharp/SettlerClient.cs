using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Settler.Sdk.Exceptions;

namespace Settler.Sdk;

/// <summary>
/// Production-grade .NET client for the Settler Reconciliation API.
/// </summary>
/// <example>
/// <code>
/// var client = new SettlerClient("sk_your_api_key");
/// var transactions = await client.Transactions.ListAsync();
/// var job = await client.Jobs.CreateAsync(new CreateJobRequest { ... });
/// </code>
/// </example>
public sealed class SettlerClient : IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly bool _ownsHttpClient;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    /// <summary>Client for transaction operations.</summary>
    public TransactionsClient Transactions { get; }

    /// <summary>Client for settlement operations.</summary>
    public SettlementsClient Settlements { get; }

    /// <summary>Client for fee operations.</summary>
    public FeesClient Fees { get; }

    /// <summary>Client for export operations.</summary>
    public ExportsClient Exports { get; }

    /// <summary>Client for currency operations.</summary>
    public CurrencyClient Currency { get; }

    /// <summary>Client for webhook operations.</summary>
    public WebhooksClient Webhooks { get; }

    /// <summary>Client for job operations.</summary>
    public JobsClient Jobs { get; }

    /// <summary>Client for report operations.</summary>
    public ReportsClient Reports { get; }

    /// <summary>Client for feature flags operations.</summary>
    public FlagsClient Flags { get; }

    /// <summary>Client for receipts operations.</summary>
    public ReceiptsClient Receipts { get; }

    /// <summary>Client for adapters operations.</summary>
    public AdaptersClient Adapters { get; }

    /// <summary>Client for console operations.</summary>
    public ConsoleClient Console { get; }

    /// <summary>
    /// Creates a new SettlerClient with the specified API key.
    /// </summary>
    /// <param name="apiKey">API key or JWT token for authentication.</param>
    /// <param name="baseUrl">Base URL for the API. Defaults to production.</param>
    /// <param name="httpClient">Optional HttpClient instance to use.</param>
    public SettlerClient(string apiKey, string? baseUrl = null, HttpClient? httpClient = null)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new ArgumentException("API key is required", nameof(apiKey));

        _apiKey = apiKey;

        if (httpClient != null)
        {
            _httpClient = httpClient;
            _ownsHttpClient = false;
        }
        else
        {
            _httpClient = new HttpClient();
            _ownsHttpClient = true;
        }

        _httpClient.BaseAddress = new Uri(baseUrl ?? "https://api.settler.io/api/v1/");
        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("settler-dotnet/1.0.0");
        _httpClient.Timeout = TimeSpan.FromSeconds(30);

        Transactions = new TransactionsClient(this);
        Settlements = new SettlementsClient(this);
        Fees = new FeesClient(this);
        Exports = new ExportsClient(this);
        Currency = new CurrencyClient(this);
        Webhooks = new WebhooksClient(this);
        Jobs = new JobsClient(this);
        Reports = new ReportsClient(this);
        Flags = new FlagsClient(this);
        Receipts = new ReceiptsClient(this);
        Adapters = new AdaptersClient(this);
        Console = new ConsoleClient(this);
    }

    internal async Task<T> RequestAsync<T>(HttpMethod method, string path, object? body = null, Dictionary<string, string>? query = null, CancellationToken cancellationToken = default)
    {
        var uri = BuildUri(path, query);
        using var request = new HttpRequestMessage(method, uri);
        SetHeaders(request, method);

        if (body != null)
        {
            var json = JsonSerializer.Serialize(body, JsonOptions);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            throw new NetworkException("Request timed out", ex);
        }
        catch (HttpRequestException ex)
        {
            throw new NetworkException($"Request failed: {ex.Message}", ex);
        }

        return await HandleResponseAsync<T>(response, cancellationToken).ConfigureAwait(false);
    }

    internal async Task RequestAsync(HttpMethod method, string path, object? body = null, CancellationToken cancellationToken = default)
    {
        var uri = BuildUri(path, null);
        using var request = new HttpRequestMessage(method, uri);
        SetHeaders(request, method);

        if (body != null)
        {
            var json = JsonSerializer.Serialize(body, JsonOptions);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            throw new NetworkException("Request timed out", ex);
        }
        catch (HttpRequestException ex)
        {
            throw new NetworkException($"Request failed: {ex.Message}", ex);
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
            throw ParseError((int)response.StatusCode, errorBody);
        }
    }

    private void SetHeaders(HttpRequestMessage request, HttpMethod method)
    {
        if (_apiKey.StartsWith("rk_") || _apiKey.StartsWith("sk_"))
        {
            request.Headers.Add("X-API-Key", _apiKey);
        }
        else
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }

        request.Headers.AcceptEncoding.ParseAdd("gzip");

        var reqId = Guid.NewGuid().ToString();
        request.Headers.Add("X-Request-ID", reqId);

        if (method == HttpMethod.Post || method == HttpMethod.Put || method == HttpMethod.Patch)
        {
            request.Headers.Add("Idempotency-Key", reqId);
        }
    }

    private static string BuildUri(string path, Dictionary<string, string>? query)
    {
        if (query == null || query.Count == 0)
            return path;

        var queryString = string.Join("&", query.Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));
        return $"{path}?{queryString}";
    }

    private async Task<T> HandleResponseAsync<T>(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        var content = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
            throw ParseError((int)response.StatusCode, content);

        return JsonSerializer.Deserialize<T>(content, JsonOptions)
            ?? throw new SettlerException("Failed to deserialize response");
    }

    private static SettlerException ParseError(int statusCode, string body)
    {
        string message = "Unknown error";
        try
        {
            var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("message", out var msgEl))
                message = msgEl.GetString() ?? message;
            else if (doc.RootElement.TryGetProperty("error", out var errEl))
                message = errEl.GetString() ?? message;
        }
        catch (JsonException) { message = body; }

        return statusCode switch
        {
            400 => new ValidationException(message),
            401 or 403 => new AuthenticationException(message),
            404 => new NotFoundException(message),
            429 => new RateLimitException(message),
            >= 500 => new ServerException(message, statusCode),
            _ => new SettlerException(message, statusCode),
        };
    }

    public void Dispose()
    {
        if (_ownsHttpClient)
            _httpClient.Dispose();
    }
}

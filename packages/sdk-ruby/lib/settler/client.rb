# frozen_string_literal: true

require "net/http"
require "uri"
require "json"
require "digest"

module Settler
  # Production-grade Ruby SDK client for Settler API
  #
  # @example
  #   client = Settler::Client.new(api_key: "sk_your_api_key")
  #   txns = client.transactions.list(provider: "stripe", limit: 50)
  #   job = client.jobs.create(provider: "stripe", date_range: { start: "...", end: "..." })
  class Client
    DEFAULT_BASE_URL = "https://api.settler.io/api/v1"
    DEFAULT_TIMEOUT = 30
    DEFAULT_MAX_RETRIES = 3

    attr_reader :api_key, :base_url, :timeout, :max_retries

    def initialize(api_key:, base_url: DEFAULT_BASE_URL, timeout: DEFAULT_TIMEOUT, max_retries: DEFAULT_MAX_RETRIES)
      raise ArgumentError, "API key is required" if api_key.nil? || api_key.empty?

      @api_key = api_key
      @base_url = base_url.chomp("/")
      @timeout = timeout
      @max_retries = max_retries
      @dedupe_cache = {}
      @dedupe_ttl = 60

      # Initialize sub-clients
      @transactions = TransactionsClient.new(self)
      @settlements = SettlementsClient.new(self)
      @fees = FeesClient.new(self)
      @exports = ExportsClient.new(self)
      @currency = CurrencyClient.new(self)
      @webhooks = WebhooksClient.new(self)
      @jobs = JobsClient.new(self)
      @reports = ReportsClient.new(self)
      @adapters = AdaptersClient.new(self)
    end

    attr_reader :transactions, :settlements, :fees, :exports, :currency,
                :webhooks, :jobs, :reports, :adapters

    def request(method:, path:, data: nil, params: nil)
      uri = URI.parse("#{@base_url}#{path}")
      uri.query = URI.encode_www_form(params) if params && !params.empty?

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.read_timeout = @timeout
      http.open_timeout = @timeout

      request_class = Net::HTTP.const_get(method.capitalize)
      request = request_class.new(uri.request_uri)

      # Support both API key and Bearer token auth
      if @api_key.start_with?("rk_", "sk_")
        request["X-API-Key"] = @api_key
      else
        request["Authorization"] = "Bearer #{@api_key}"
      end

      request["Content-Type"] = "application/json"
      request["User-Agent"] = "settler-ruby/1.0.0"
      request.body = data.to_json if data

      retries = 0
      begin
        response = http.request(request)
        handle_response(response)
      rescue Net::TimeoutError, Errno::ECONNREFUSED, Errno::EHOSTUNREACH => e
        retries += 1
        if retries <= @max_retries
          sleep(2**retries)
          retry
        end
        raise NetworkError, "Request failed: #{e.message}"
      end
    end

    private

    def handle_response(response)
      case response.code.to_i
      when 200..299
        return nil if response.body.nil? || response.body.empty?
        JSON.parse(response.body)
      when 400
        raise ValidationError, parse_error_message(response)
      when 401, 403
        raise AuthenticationError, parse_error_message(response)
      when 404
        raise NotFoundError, parse_error_message(response)
      when 422
        raise ValidationError, parse_error_message(response)
      when 429
        raise RateLimitError, parse_error_message(response)
      when 500..599
        raise ServerError, parse_error_message(response)
      else
        raise SettlerError, parse_error_message(response)
      end
    end

    def parse_error_message(response)
      parsed = JSON.parse(response.body)
      parsed["message"] || parsed["error"] || "Unknown error"
    rescue JSON::ParserError
      response.body || "Unknown error"
    end
  end

  # Transactions client
  class TransactionsClient
    def initialize(client)
      @client = client
    end

    def list(page: nil, limit: nil, provider: nil, status: nil, type: nil,
             payment_id: nil, start_date: nil, end_date: nil)
      params = {}
      params[:page] = page if page
      params[:limit] = limit if limit
      params[:provider] = provider if provider
      params[:status] = status if status
      params[:type] = type if type
      params[:paymentId] = payment_id if payment_id
      params[:startDate] = start_date if start_date
      params[:endDate] = end_date if end_date
      @client.request(method: "GET", path: "/transactions", params: params)
    end

    def get(transaction_id)
      @client.request(method: "GET", path: "/transactions/#{transaction_id}")
    end
  end

  # Settlements client
  class SettlementsClient
    def initialize(client)
      @client = client
    end

    def list(page: nil, limit: nil, provider: nil, status: nil,
             start_date: nil, end_date: nil)
      params = {}
      params[:page] = page if page
      params[:limit] = limit if limit
      params[:provider] = provider if provider
      params[:status] = status if status
      params[:startDate] = start_date if start_date
      params[:endDate] = end_date if end_date
      @client.request(method: "GET", path: "/settlements", params: params)
    end

    def get(settlement_id)
      @client.request(method: "GET", path: "/settlements/#{settlement_id}")
    end
  end

  # Fees client
  class FeesClient
    def initialize(client)
      @client = client
    end

    def list(transaction_id: nil, settlement_id: nil, type: nil)
      params = {}
      params[:transactionId] = transaction_id if transaction_id
      params[:settlementId] = settlement_id if settlement_id
      params[:type] = type if type
      @client.request(method: "GET", path: "/fees", params: params)
    end

    def effective_rate(transaction_id: nil, provider: nil, start_date: nil, end_date: nil)
      params = {}
      params[:transactionId] = transaction_id if transaction_id
      params[:provider] = provider if provider
      params[:startDate] = start_date if start_date
      params[:endDate] = end_date if end_date
      @client.request(method: "GET", path: "/fees/effective-rate", params: params)
    end
  end

  # Exports client
  class ExportsClient
    def initialize(client)
      @client = client
    end

    def create(job_id:, format:, date_range:, options: nil)
      data = { jobId: job_id, format: format, dateRange: date_range }
      data[:options] = options if options
      @client.request(method: "POST", path: "/exports", data: data)
    end
  end

  # Currency client
  class CurrencyClient
    def initialize(client)
      @client = client
    end

    def convert(value:, from_currency:, to_currency:, date: nil)
      data = {
        amount: { value: value, currency: from_currency },
        toCurrency: to_currency
      }
      data[:date] = date if date
      @client.request(method: "POST", path: "/currency/convert", data: data)
    end

    def fx_rate(from_currency:, to_currency:, date: nil)
      params = { fromCurrency: from_currency, toCurrency: to_currency }
      params[:date] = date if date
      @client.request(method: "GET", path: "/currency/fx-rate", params: params)
    end
  end

  # Webhooks client
  class WebhooksClient
    def initialize(client)
      @client = client
    end

    def receive(adapter:, payload:)
      @client.request(method: "POST", path: "/webhooks/receive/#{adapter}", data: payload)
    end
  end

  # Jobs client
  class JobsClient
    def initialize(client)
      @client = client
    end

    def create(provider:, date_range:, options: nil)
      data = { provider: provider, dateRange: date_range }
      data[:options] = options if options
      @client.request(method: "POST", path: "/jobs", data: data)
    end

    def list(page: nil, limit: nil, status: nil, provider: nil)
      params = {}
      params[:page] = page if page
      params[:limit] = limit if limit
      params[:status] = status if status
      params[:provider] = provider if provider
      @client.request(method: "GET", path: "/jobs", params: params)
    end

    def get(job_id)
      @client.request(method: "GET", path: "/jobs/#{job_id}")
    end

    def run(job_id)
      @client.request(method: "POST", path: "/jobs/#{job_id}/run")
    end

    def delete(job_id)
      @client.request(method: "DELETE", path: "/jobs/#{job_id}")
    end
  end

  # Reports client
  class ReportsClient
    def initialize(client)
      @client = client
    end

    def get(job_id)
      @client.request(method: "GET", path: "/reports/#{job_id}")
    end

    def unmatched(job_id)
      @client.request(method: "GET", path: "/reports/#{job_id}/unmatched")
    end
  end

  # Adapters client
  class AdaptersClient
    def initialize(client)
      @client = client
    end

    def list
      @client.request(method: "GET", path: "/adapters")
    end

    def get(adapter_name)
      @client.request(method: "GET", path: "/adapters/#{adapter_name}")
    end
  end
end

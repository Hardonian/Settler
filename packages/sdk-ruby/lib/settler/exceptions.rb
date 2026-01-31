# frozen_string_literal: true

module Settler
  # Base error class for all Settler SDK errors
  class SettlerError < StandardError; end

  # Network-related errors (timeout, connection, etc.)
  class NetworkError < SettlerError; end

  # Authentication errors (invalid API key, expired token, etc.)
  class AuthenticationError < SettlerError; end

  # Validation errors (invalid input, missing fields, etc.)
  class ValidationError < SettlerError; end

  # Resource not found errors
  class NotFoundError < SettlerError; end

  # Rate limit exceeded errors
  class RateLimitError < SettlerError; end

  # Server errors (5xx)
  class ServerError < SettlerError; end
end

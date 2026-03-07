# frozen_string_literal: true

require_relative "lib/settler/version"

Gem::Specification.new do |spec|
  spec.name = "settler-sdk"
  spec.version = Settler::VERSION
  spec.authors = ["Settler"]
  spec.email = ["support@settler.io"]

  spec.summary = "Production-grade Ruby SDK for Settler Reconciliation API"
  spec.description = "Ruby SDK for Settler - Open Source Reconciliation Engine API"
  spec.homepage = "https://github.com/settler/settler-ruby"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 2.7.0"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = spec.homepage
  spec.metadata["changelog_uri"] = "#{spec.homepage}/blob/main/CHANGELOG.md"

  spec.files = Dir.chdir(__dir__) do
    `git ls-files -z`.split("\x0").reject do |f|
      (File.expand_path(f) == __FILE__) ||
        f.start_with?(*%w[bin/ test/ spec/ features/ .git .github .rspec .rubocop])
    end
  end
  spec.bindir = "exe"
  spec.executables = spec.files.grep(%r{\Aexe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]
end

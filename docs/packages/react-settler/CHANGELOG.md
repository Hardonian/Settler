# Changelog

All notable changes to React.Settler will be documented in this file.

## [0.1.0] - 2024-01-01

### Added
- Initial release
- Core components: ReconciliationDashboard, TransactionTable, ExceptionTable, MetricCard, RuleSet, MatchRule
- Config compiler for extracting JSON from React trees
- Protocol types package (@settler/protocol)
- Security features: input validation, XSS protection, sanitization
- Enterprise features: audit logging, telemetry, error boundaries
- Performance optimizations: memoization, virtualization
- Testing utilities: mock data generators, test wrappers
- Additional components: FilterBar, SearchBar, ExportButton, VirtualizedTable
- Comprehensive documentation: security guide, performance guide, testing guide

### Security
- XSS protection via automatic string sanitization
- Input validation hooks
- PII masking in telemetry
- Audit logging support
- Security context for access control

### Performance
- Memoized components
- Virtualized table for large datasets
- Debounced search
- Optimized filtering and sorting hooks

### Developer Experience
- TypeScript support throughout
- React hooks for common operations
- Testing utilities
- Comprehensive examples
- Detailed documentation

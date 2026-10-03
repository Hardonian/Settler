-- Pair the alert_history tenant-scope policy with its minimal table grant
-- (2026-10-03). The policy added in 20261003013025 scopes SELECT to tenant
-- members and admin-only global rows; the server-only grant revocation
-- (20261003012119) predates that policy and removed the SELECT grant. This
-- restores exactly SELECT for authenticated — the policy is the enforcement
-- boundary. Writes remain service-side only (no INSERT/UPDATE/DELETE grants).

GRANT SELECT ON public.alert_history TO authenticated;

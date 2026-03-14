# UI Consistency Matrix

| Surface          | Canonical pattern                                        | Current status | Notes                                                    |
| ---------------- | -------------------------------------------------------- | -------------- | -------------------------------------------------------- |
| Page headers     | Route-owned heading + short operational subcopy          | Partial        | High-traffic console pages still vary in heading density |
| Section headers  | Compact title + optional helper line                     | Partial        | Present but not unified by a single primitive            |
| Cards            | `Card` with restrained border/shadow; consistent spacing | Improving      | State cards now unified via `RouteStateCard`             |
| Buttons          | Primary action first, secondary outline                  | Improving      | Route state actions now normalized                       |
| Tables           | Card-contained or full-width with readable row density   | Partial        | Still route-dependent                                    |
| Forms            | Label + helper + error association                       | Partial        | No global form group primitive added in this pass        |
| Filters/toolbars | Single top toolbar row with wrap on mobile               | Partial        | Exists in some console pages only                        |
| Badges/status    | Semantic color + short status phrase                     | Partial        | Multiple badge styles remain                             |
| Empty states     | Icon + title + detail + action(s)                        | Improving      | New route-level canonical state adopted on core surfaces |
| Loading states   | Skeletons matching target layout                         | Partial        | Dashboard/console skeletons remain custom                |
| Error states     | Canonical state card with recovery actions               | Improving      | Console and dashboard route states aligned               |
| Dialogs/drawers  | Accessible semantics with deterministic actions          | Partial        | Existing primitives used, not reworked                   |
| Callouts/alerts  | Short severity + operator guidance                       | Partial        | Needs broader adoption across pages                      |

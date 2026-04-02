# Monthly Close Checklist

## Close calendar (target)

- D-2 to D0: usage/billing cutoff validation
- D+1 to D+3: invoicing, cash application, deferred revenue rollforward
- D+4 to D+5: P&L/ARR metrics review and issue log finalization

## Recurring tasks

| Task                         | Owner         | Evidence                 | Source systems          |
| ---------------------------- | ------------- | ------------------------ | ----------------------- |
| Export booked contracts      | RevOps        | contract export snapshot | CRM/contract repo       |
| Invoice reconciliation       | Finance       | open/paid invoice report | Billing system          |
| Cash reconciliation          | Finance       | bank-to-invoice tieout   | Bank + billing          |
| Deferred revenue rollforward | Finance       | rollforward worksheet    | Accounting system       |
| Usage-overage validation     | RevOps + Eng  | usage vs invoice tieout  | Product usage + billing |
| Collections review           | Revenue owner | aged AR log              | Billing + bank          |
| Tax check reminders          | Finance       | tax calendar update      | tax worksheet           |
| Exception log closure        | Founder       | signed issue log         | close issues template   |

## Exception handling

Any unresolved issue at D+5 is logged with owner/date in `../08_Templates/MONTHLY_CLOSE_ISSUES_LOG_TEMPLATE.md`.

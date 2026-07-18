# Office Payroll control plane — LTS v1 boundary

## Release scope

The first stable increment solves one bounded operating problem: keeping an employee register,
effective compensation configuration, calculation snapshot, independent approval, posting state,
and audit evidence in one server-authoritative workflow.

It is not a general ledger, attendance system, bank-disbursement rail, tax return engine, or legal
interpretation of Bangladesh employment rules. Those capabilities need separately approved policy,
effective dates, reconciliation, and specialist review.

## Workflow and ownership

```text
Accounts: employee + compensation -> draft run -> submit
Manager/owner/admin: independent approval
Owner/admin: post the approved operating record
Audit: append-only evidence for every successful mutation
```

- `payroll.read` is limited to owner, admin, manager, and accounts roles.
- `payroll.write` belongs to owner, admin, and accounts.
- `payroll.approve` belongs to owner, admin, and manager; the run creator cannot self-approve.
- `payroll.post` belongs to owner and admin.
- Every mutation is authorized again inside its Server Action. UI visibility is not authorization.
- Optimistic versions prevent a stale browser from repeating a transition.

## Calculation contract

- Money is stored and calculated in integer minor units.
- Active fixed components and configured base-percentage components are snapshotted into each entry.
- Base-percentage calculations use half-up rounding to the nearest minor unit.
- Deductions cannot exceed contractual gross pay.
- A run is one complete calendar month and is bounded to 100 employees.
- Employees joining mid-month, profiles effective mid-month, attendance, overtime, unpaid leave, and
  partial-month proration are excluded from automatic v1 calculation. This prevents an unapproved
  proration convention from becoming payroll truth.
- No statutory rate is built in. Tax, provident fund, gratuity, overtime, and other regulated values
  must remain configurable, effective-dated, and legally reviewed before a later engine enables them.

## Data and recovery model

- Migration: `drizzle/0005_payroll_control_plane.sql`.
- Historical run entries keep employee and component JSON snapshots; later profile changes cannot
  rewrite a posted run.
- Database checks enforce allowed states, non-negative amounts, total identities, complete approval
  timestamps, and foreign-key integrity.
- Apply the migration to a staging D1 database first, run the focused payroll tests, back up the
  production database, and then apply it during a controlled release window.
- The migration is additive. Rollback should disable the route and restore the pre-release database;
  dropping payroll tables is not a safe production rollback after records exist.

## Required follow-on gates before statutory payroll

1. Legal and accounting approval of every Bangladesh payroll rule and its effective date.
2. Attendance and leave source-of-truth with reviewed proration rules.
3. Payslip document, privacy-retention schedule, and restricted export policy.
4. Bank disbursement adapter with dual control, idempotency, and reconciliation.
5. Adjustment/reversal workflow; never edit or delete a posted run.
6. Field-level encryption strategy for future bank and government identifiers.

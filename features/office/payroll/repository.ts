import { getD1 } from "@/db";
import {
  createOfficeAuditEvent,
  OfficeRepositoryError,
  prepareOfficeAuditInsert,
  type OfficeRepositoryActor,
} from "@/features/office/repository";
import {
  calculatePayroll,
  officeEmployeeCompensationInputSchema,
  officePayrollRunInputSchema,
  validatePayrollMakerChecker,
  validatePayrollRunTransition,
  type OfficeCompensationCalculationType,
  type OfficeCompensationComponentInput,
  type OfficeCompensationComponentKind,
  type OfficeCompensationComponentStatus,
  type OfficeEmployeeCompensationInput,
  type OfficeEmployeeStatus,
  type OfficeEmploymentType,
  type OfficePayrollRunInput,
  type OfficePayrollRunStatus,
  type PayrollCalculation,
} from "@/features/office/payroll/types";

const MAX_PAYROLL_EMPLOYEES_PER_RUN = 100;

export type PayrollEmployeeView = Readonly<{
  id: string;
  employeeCode: string;
  memberId: string | null;
  memberName: string | null;
  displayName: string;
  designation: string;
  department: string;
  employmentType: OfficeEmploymentType;
  status: OfficeEmployeeStatus;
  joinDate: string;
  separationDate: string | null;
  profileId: string | null;
  effectiveFrom: string | null;
  currency: string | null;
  calculation: PayrollCalculation | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}>;

export type PayrollRunView = Readonly<{
  id: string;
  number: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  status: OfficePayrollRunStatus;
  employeeCount: number;
  baseSalaryMinor: number;
  allowanceMinor: number;
  deductionMinor: number;
  grossMinor: number;
  netMinor: number;
  note: string | null;
  createdByMemberId: string;
  createdByName: string | null;
  approvedByMemberId: string | null;
  approvedByName: string | null;
  postedByMemberId: string | null;
  postedByName: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  postedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}>;

type EmployeeComponentRow = {
  id: string;
  employee_code: string;
  member_id: string | null;
  member_name: string | null;
  display_name: string;
  designation: string;
  department: string;
  employment_type: OfficeEmploymentType;
  status: OfficeEmployeeStatus;
  join_date: string;
  separation_date: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  profile_id: string | null;
  effective_from: string | null;
  base_salary_minor: number | null;
  currency: string | null;
  component_id: string | null;
  component_name: string | null;
  component_kind: OfficeCompensationComponentKind | null;
  calculation_type: OfficeCompensationCalculationType | null;
  component_value: number | null;
  component_status: OfficeCompensationComponentStatus | null;
};

type RunRow = {
  id: string;
  number: string;
  period_start: string;
  period_end: string;
  currency: string;
  status: OfficePayrollRunStatus;
  employee_count: number;
  base_salary_minor: number;
  allowance_minor: number;
  deduction_minor: number;
  gross_minor: number;
  net_minor: number;
  note: string | null;
  created_by_member_id: string;
  created_by_name: string | null;
  approved_by_member_id: string | null;
  approved_by_name: string | null;
  posted_by_member_id: string | null;
  posted_by_name: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  posted_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
};

function requireActorMemberId(actor: OfficeRepositoryActor): string {
  if (actor.memberId) return actor.memberId;
  throw new OfficeRepositoryError(
    "invalid_state",
    "Activate a durable office membership before changing payroll records.",
  );
}

function requireChanged(result: D1Result, message: string): void {
  if (result.meta.changes === 1) return;
  throw new OfficeRepositoryError("optimistic_conflict", message);
}

function normalizeNote(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function safeSum(values: readonly number[], label: string): number {
  let sum = BigInt(0);
  for (const value of values) sum += BigInt(value);
  if (sum > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`${label} exceeds the supported safe integer range.`);
  }
  return Number(sum);
}

function mapRun(row: RunRow): PayrollRunView {
  return {
    id: row.id,
    number: row.number,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    currency: row.currency,
    status: row.status,
    employeeCount: row.employee_count,
    baseSalaryMinor: row.base_salary_minor,
    allowanceMinor: row.allowance_minor,
    deductionMinor: row.deduction_minor,
    grossMinor: row.gross_minor,
    netMinor: row.net_minor,
    note: row.note,
    createdByMemberId: row.created_by_member_id,
    createdByName: row.created_by_name,
    approvedByMemberId: row.approved_by_member_id,
    approvedByName: row.approved_by_name,
    postedByMemberId: row.posted_by_member_id,
    postedByName: row.posted_by_name,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    postedAt: row.posted_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function componentsFromRows(rows: readonly EmployeeComponentRow[]): OfficeCompensationComponentInput[] {
  return rows.flatMap((row) => {
    if (
      row.component_id === null ||
      row.component_name === null ||
      row.component_kind === null ||
      row.calculation_type === null ||
      row.component_value === null ||
      row.component_status === null
    ) {
      return [];
    }
    return [{
      name: row.component_name,
      kind: row.component_kind,
      calculationType: row.calculation_type,
      value: row.component_value,
      status: row.component_status,
    }];
  });
}

function groupEmployeeRows(rows: readonly EmployeeComponentRow[]): PayrollEmployeeView[] {
  const grouped = new Map<string, EmployeeComponentRow[]>();
  for (const row of rows) {
    const group = grouped.get(row.id);
    if (group) group.push(row);
    else grouped.set(row.id, [row]);
  }

  return Array.from(grouped.values(), (employeeRows) => {
    const row = employeeRows[0];
    if (!row) throw new TypeError("Payroll employee query returned an empty row group.");
    const calculation = row.profile_id && row.base_salary_minor !== null
      ? calculatePayroll({
          baseSalaryMinor: row.base_salary_minor,
          components: componentsFromRows(employeeRows),
        })
      : null;
    return {
      id: row.id,
      employeeCode: row.employee_code,
      memberId: row.member_id,
      memberName: row.member_name,
      displayName: row.display_name,
      designation: row.designation,
      department: row.department,
      employmentType: row.employment_type,
      status: row.status,
      joinDate: row.join_date,
      separationDate: row.separation_date,
      profileId: row.profile_id,
      effectiveFrom: row.effective_from,
      currency: row.currency,
      calculation,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

const EMPLOYEE_COMPONENT_SELECT = `SELECT
  employee.id, employee.employee_code, employee.member_id, member.display_name AS member_name,
  employee.display_name, employee.designation, employee.department, employee.employment_type,
  employee.status, employee.join_date, employee.separation_date, employee.version,
  employee.created_at, employee.updated_at, profile.id AS profile_id,
  profile.effective_from, profile.base_salary_minor, profile.currency,
  component.id AS component_id, component.name AS component_name,
  component.kind AS component_kind, component.calculation_type,
  component.value AS component_value, component.status AS component_status
FROM office_employees employee
LEFT JOIN office_members member ON member.id = employee.member_id
LEFT JOIN office_compensation_profiles profile
  ON profile.employee_id = employee.id AND profile.status = 'active'
LEFT JOIN office_compensation_components component
  ON component.profile_id = profile.id AND component.status = 'active'`;

const RUN_SELECT = `SELECT
  run.id, run.number, run.period_start, run.period_end, run.currency, run.status,
  run.employee_count, run.base_salary_minor, run.allowance_minor, run.deduction_minor,
  run.gross_minor, run.net_minor, run.note, run.created_by_member_id,
  creator.display_name AS created_by_name, run.approved_by_member_id,
  approver.display_name AS approved_by_name, run.posted_by_member_id,
  poster.display_name AS posted_by_name, run.submitted_at, run.approved_at, run.posted_at,
  run.version, run.created_at, run.updated_at
FROM office_payroll_runs run
LEFT JOIN office_members creator ON creator.id = run.created_by_member_id
LEFT JOIN office_members approver ON approver.id = run.approved_by_member_id
LEFT JOIN office_members poster ON poster.id = run.posted_by_member_id`;

export async function listPayrollEmployees(options: {
  status?: OfficeEmployeeStatus;
  limit?: number;
} = {}): Promise<PayrollEmployeeView[]> {
  const database = await getD1();
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 200);
  const where = options.status ? "WHERE employee.status = ?" : "";
  const statement = database.prepare(
    `${EMPLOYEE_COMPONENT_SELECT} ${where}
     ORDER BY CASE employee.status WHEN 'active' THEN 0 WHEN 'suspended' THEN 1 ELSE 2 END,
       employee.employee_code ASC, component.name ASC
     LIMIT ?`,
  );
  const result = options.status
    ? await statement.bind(options.status, limit * 25).all<EmployeeComponentRow>()
    : await statement.bind(limit * 25).all<EmployeeComponentRow>();
  return groupEmployeeRows(result.results).slice(0, limit);
}

export async function listPayrollRuns(options: { limit?: number } = {}): Promise<PayrollRunView[]> {
  const database = await getD1();
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const result = await database
    .prepare(`${RUN_SELECT} ORDER BY run.period_end DESC, run.created_at DESC LIMIT ?`)
    .bind(limit)
    .all<RunRow>();
  return result.results.map(mapRun);
}

async function getPayrollEmployeeById(
  database: D1Database,
  employeeId: string,
): Promise<PayrollEmployeeView | null> {
  const result = await database
    .prepare(`${EMPLOYEE_COMPONENT_SELECT} WHERE employee.id = ? ORDER BY component.name ASC`)
    .bind(employeeId)
    .all<EmployeeComponentRow>();
  return groupEmployeeRows(result.results)[0] ?? null;
}

export async function createPayrollEmployee(
  rawInput: OfficeEmployeeCompensationInput,
  actor: OfficeRepositoryActor,
): Promise<PayrollEmployeeView> {
  const input = officeEmployeeCompensationInputSchema.parse(rawInput);
  const createdByMemberId = requireActorMemberId(actor);
  calculatePayroll({ baseSalaryMinor: input.baseSalaryMinor, components: input.components });
  const database = await getD1();
  const employeeId = crypto.randomUUID();
  const profileId = crypto.randomUUID();
  const now = new Date().toISOString();
  const audit = createOfficeAuditEvent({
    actor,
    action: "payroll.employee_created",
    entityType: "employee",
    entityId: employeeId,
    metadata: {
      employeeCode: input.employeeCode,
      profileId,
      currency: input.currency,
      componentCount: input.components.length,
    },
    createdAt: now,
  });
  const statements: D1PreparedStatement[] = [
    database
      .prepare(
        `INSERT INTO office_employees
          (id, employee_code, member_id, display_name, designation, department, employment_type,
           status, join_date, separation_date, created_by_member_id, version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, NULL, ?, 1, ?, ?)`,
      )
      .bind(
        employeeId,
        input.employeeCode,
        input.memberId,
        input.displayName,
        input.designation,
        input.department,
        input.employmentType,
        input.joinDate,
        createdByMemberId,
        now,
        now,
      ),
    database
      .prepare(
        `INSERT INTO office_compensation_profiles
          (id, employee_id, status, effective_from, base_salary_minor, currency, pay_frequency,
           created_by_member_id, version, created_at, updated_at)
         VALUES (?, ?, 'active', ?, ?, ?, 'monthly', ?, 1, ?, ?)`,
      )
      .bind(
        profileId,
        employeeId,
        input.joinDate,
        input.baseSalaryMinor,
        input.currency,
        createdByMemberId,
        now,
        now,
      ),
    ...input.components.map((component) => database
      .prepare(
        `INSERT INTO office_compensation_components
          (id, profile_id, name, kind, calculation_type, value, status, version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        profileId,
        component.name,
        component.kind,
        component.calculationType,
        component.value,
        component.status,
        now,
        now,
      )),
    prepareOfficeAuditInsert(database, audit),
  ];
  await database.batch(statements);

  const created = await getPayrollEmployeeById(database, employeeId);
  if (!created) throw new OfficeRepositoryError("not_found", "Created employee could not be read.");
  return created;
}

export async function createPayrollRun(
  rawInput: OfficePayrollRunInput,
  actor: OfficeRepositoryActor,
): Promise<PayrollRunView> {
  const input = officePayrollRunInputSchema.parse(rawInput);
  const memberId = requireActorMemberId(actor);
  const database = await getD1();
  const eligible = await database
    .prepare(
      `WITH eligible AS (
         SELECT employee.id
         FROM office_employees employee
         JOIN office_compensation_profiles profile
           ON profile.employee_id = employee.id AND profile.status = 'active'
         WHERE employee.status = 'active'
           AND employee.join_date <= ?
           AND (employee.separation_date IS NULL OR employee.separation_date >= ?)
           AND profile.effective_from <= ?
           AND profile.currency = ?
         ORDER BY employee.employee_code ASC
         LIMIT ?
       )
       ${EMPLOYEE_COMPONENT_SELECT}
       JOIN eligible ON eligible.id = employee.id
       ORDER BY employee.employee_code ASC, component.name ASC`,
    )
    .bind(
      input.periodStart,
      input.periodEnd,
      input.periodStart,
      input.currency,
      MAX_PAYROLL_EMPLOYEES_PER_RUN + 1,
    )
    .all<EmployeeComponentRow>();
  const employees = groupEmployeeRows(eligible.results);
  if (employees.length === 0) {
    throw new OfficeRepositoryError(
      "invalid_state",
      "No active employee has an effective compensation profile in this currency and payroll period.",
    );
  }
  if (employees.length > MAX_PAYROLL_EMPLOYEES_PER_RUN) {
    throw new OfficeRepositoryError(
      "invalid_state",
      `A payroll run is limited to ${MAX_PAYROLL_EMPLOYEES_PER_RUN} employees. Split the run by reviewed operating unit.`,
    );
  }
  if (employees.some((employee) => employee.calculation === null || employee.profileId === null)) {
    throw new OfficeRepositoryError(
      "invalid_state",
      "Every included employee must have one effective active compensation profile.",
    );
  }

  const calculations = employees.map((employee) => employee.calculation as PayrollCalculation);
  const totals = {
    baseSalaryMinor: safeSum(calculations.map((value) => value.baseSalaryMinor), "Payroll base total"),
    allowanceMinor: safeSum(calculations.map((value) => value.allowanceMinor), "Payroll allowance total"),
    deductionMinor: safeSum(calculations.map((value) => value.deductionMinor), "Payroll deduction total"),
    grossMinor: safeSum(calculations.map((value) => value.grossMinor), "Payroll gross total"),
    netMinor: safeSum(calculations.map((value) => value.netMinor), "Payroll net total"),
  };
  const runId = crypto.randomUUID();
  const now = new Date().toISOString();
  const number = `PAY-${input.periodStart.replaceAll("-", "")}-${input.periodEnd.replaceAll("-", "")}-${runId.slice(0, 8).toUpperCase()}`;
  const settingsSnapshot = JSON.stringify({
    engineVersion: "ap-payroll-v1",
    calculationBoundary: "contractual_components_only",
    statutoryDefaultsApplied: false,
    rounding: "half_up_to_minor_unit",
  });
  const audit = createOfficeAuditEvent({
    actor,
    action: "payroll.run_created",
    entityType: "payroll_run",
    entityId: runId,
    metadata: {
      number,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      currency: input.currency,
      employeeCount: employees.length,
      calculationBoundary: "contractual_components_only",
    },
    createdAt: now,
  });
  const statements: D1PreparedStatement[] = [
    database
      .prepare(
        `INSERT INTO office_payroll_runs
          (id, number, period_start, period_end, currency, status, employee_count,
           base_salary_minor, allowance_minor, deduction_minor, gross_minor, net_minor,
           settings_snapshot, note, created_by_member_id, approved_by_member_id,
           posted_by_member_id, submitted_at, approved_at, posted_at, version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, 1, ?, ?)`,
      )
      .bind(
        runId,
        number,
        input.periodStart,
        input.periodEnd,
        input.currency,
        employees.length,
        totals.baseSalaryMinor,
        totals.allowanceMinor,
        totals.deductionMinor,
        totals.grossMinor,
        totals.netMinor,
        settingsSnapshot,
        normalizeNote(input.note),
        memberId,
        now,
        now,
      ),
    ...employees.map((employee) => {
      const calculation = employee.calculation as PayrollCalculation;
      return database
        .prepare(
          `INSERT INTO office_payroll_entries
            (id, run_id, employee_id, employee_snapshot, compensation_profile_id, status,
             base_salary_minor, allowance_minor, deduction_minor, gross_minor, net_minor,
             component_snapshot, version, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'included', ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          runId,
          employee.id,
          JSON.stringify({
            employeeCode: employee.employeeCode,
            displayName: employee.displayName,
            designation: employee.designation,
            department: employee.department,
          }),
          employee.profileId,
          calculation.baseSalaryMinor,
          calculation.allowanceMinor,
          calculation.deductionMinor,
          calculation.grossMinor,
          calculation.netMinor,
          JSON.stringify(calculation.components),
          now,
          now,
        );
    }),
    prepareOfficeAuditInsert(database, audit),
  ];
  await database.batch(statements);

  const created = await database
    .prepare(`${RUN_SELECT} WHERE run.id = ? LIMIT 1`)
    .bind(runId)
    .first<RunRow>();
  if (!created) throw new OfficeRepositoryError("not_found", "Created payroll run could not be read.");
  return mapRun(created);
}

export async function transitionPayrollRun(
  input: Readonly<{
    runId: string;
    expectedVersion: number;
    nextStatus: OfficePayrollRunStatus;
  }>,
  actor: OfficeRepositoryActor,
): Promise<PayrollRunView> {
  const memberId = requireActorMemberId(actor);
  const database = await getD1();
  const currentRow = await database
    .prepare(`${RUN_SELECT} WHERE run.id = ? LIMIT 1`)
    .bind(input.runId)
    .first<RunRow>();
  if (!currentRow) throw new OfficeRepositoryError("not_found", "Payroll run was not found.");
  const current = mapRun(currentRow);
  if (current.version !== input.expectedVersion) {
    throw new OfficeRepositoryError("optimistic_conflict", "Payroll run changed. Reload before continuing.");
  }
  const transitionError = validatePayrollRunTransition(current.status, input.nextStatus);
  if (transitionError) throw new OfficeRepositoryError("invalid_state", transitionError);
  if (input.nextStatus === "approved") {
    const makerCheckerError = validatePayrollMakerChecker(current.createdByMemberId, memberId);
    if (makerCheckerError) throw new OfficeRepositoryError("self_approval", makerCheckerError);
  }
  if (input.nextStatus === "posted" && current.approvedByMemberId === null) {
    throw new OfficeRepositoryError("invalid_state", "Only an independently approved payroll run can be posted.");
  }

  const now = new Date().toISOString();
  const nextVersion = current.version + 1;
  const audit = createOfficeAuditEvent({
    actor,
    action: `payroll.run_${input.nextStatus}`,
    entityType: "payroll_run",
    entityId: current.id,
    metadata: {
      number: current.number,
      fromStatus: current.status,
      toStatus: input.nextStatus,
      nextVersion,
    },
    createdAt: now,
  });
  const results = await database.batch([
    database
      .prepare(
        `UPDATE office_payroll_runs SET
           status = ?,
           submitted_at = CASE WHEN ? = 'pending_approval' THEN ? ELSE submitted_at END,
           approved_by_member_id = CASE WHEN ? = 'approved' THEN ? ELSE approved_by_member_id END,
           approved_at = CASE WHEN ? = 'approved' THEN ? ELSE approved_at END,
           posted_by_member_id = CASE WHEN ? = 'posted' THEN ? ELSE posted_by_member_id END,
           posted_at = CASE WHEN ? = 'posted' THEN ? ELSE posted_at END,
           version = ?, updated_at = ?
         WHERE id = ? AND status = ? AND version = ?`,
      )
      .bind(
        input.nextStatus,
        input.nextStatus,
        now,
        input.nextStatus,
        memberId,
        input.nextStatus,
        now,
        input.nextStatus,
        memberId,
        input.nextStatus,
        now,
        nextVersion,
        now,
        current.id,
        current.status,
        current.version,
      ),
    database
      .prepare(
        `INSERT INTO office_audit_events
          (id, actor_member_id, actor_email, action, entity_type, entity_id, metadata,
           request_id, ip_hash, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
         FROM office_payroll_runs
         WHERE id = ? AND status = ? AND version = ? AND updated_at = ?`,
      )
      .bind(
        audit.id,
        audit.actorMemberId,
        audit.actorEmail,
        audit.action,
        audit.entityType,
        audit.entityId,
        audit.metadata,
        audit.requestId,
        audit.ipHash,
        audit.createdAt,
        current.id,
        input.nextStatus,
        nextVersion,
        now,
      ),
  ]);
  requireChanged(results[0], "Payroll run changed before the transition completed.");
  requireChanged(results[1], "Payroll transition audit was not committed.");

  const updated = await database
    .prepare(`${RUN_SELECT} WHERE run.id = ? LIMIT 1`)
    .bind(current.id)
    .first<RunRow>();
  if (!updated) throw new OfficeRepositoryError("not_found", "Updated payroll run could not be read.");
  return mapRun(updated);
}

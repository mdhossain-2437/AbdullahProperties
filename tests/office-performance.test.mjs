import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

async function readProjectFile(relativePath) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

async function officePageFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return officePageFiles(absolutePath);
    return entry.isFile() && entry.name === "page.tsx" ? [absolutePath] : [];
  }));
  return nested.flat();
}

function exportedFunctionSource(source, functionName) {
  const start = source.indexOf(`export async function ${functionName}`);
  assert.ok(start >= 0, `${functionName} should be exported`);
  const end = source.indexOf("\n}\n", start);
  assert.ok(end > start, `${functionName} source boundary should exist`);
  return source.slice(start, end + 2);
}

test("Office routes use a binding-only availability guard instead of a schema query", async () => {
  const officePagesRoot = path.join(projectRoot, "app", "(office)", "office");
  const pages = await officePageFiles(officePagesRoot);
  assert.ok(pages.length >= 15, "the complete Office route set should be inspected");

  for (const page of pages) {
    const source = await readFile(page, "utf8");
    assert.doesNotMatch(source, /getOfficeDatabaseHealth/, `${page} must not run the schema health probe`);
    assert.doesNotMatch(source, /sqlite_master/, `${page} must not query schema metadata`);
    assert.match(source, /isOfficeDatabaseAvailable/, `${page} must preserve the unavailable-storage state`);
  }

  const repository = await readProjectFile("features/office/repository.ts");
  const availabilitySource = exportedFunctionSource(repository, "isOfficeDatabaseAvailable");
  assert.match(availabilitySource, /getOptionalD1\(\)/);
  assert.doesNotMatch(availabilitySource, /\.prepare\(|\.first\(|\.all\(/);
});

test("composer reference queries stay bounded and select purpose-built projections", async () => {
  const repository = await readProjectFile("features/office/repository.ts");
  assert.match(repository, /LIMIT \? OFFSET \?/);

  const optionFunctions = [
    "listOfficeContactOptions",
    "listOfficeLeadOptions",
    "listOfficeLandParcelOptions",
    "listOfficeProjectOptions",
    "listOfficeTeamMemberOptions",
    "listOfficeInvoiceOptions",
    "listOfficePaymentOptions",
    "listOfficeExpenseOptions",
    "listOfficeApprovalOptions",
  ];

  for (const functionName of optionFunctions) {
    const source = exportedFunctionSource(repository, functionName);
    assert.match(source, /prepareBoundedList\(/, `${functionName} must enforce the shared list bounds`);
    assert.match(source, /SELECT /, `${functionName} must own a narrow projection`);
    assert.doesNotMatch(
      source,
      /CONTACT_SELECT|LEAD_SELECT|LAND_SELECT|PROJECT_SELECT|INVOICE_SUMMARY_SELECT|PAYMENT_SELECT|EXPENSE_SELECT|APPROVAL_SELECT/,
      `${functionName} must not reuse a full register projection`,
    );
  }
});

test("high-cost Office composers use reference queries for option data", async () => {
  const expectations = {
    "tasks/page.tsx": { references: ["Contact", "Lead", "LandParcel", "Project", "TeamMember"], primaryRegister: "Tasks" },
    "documents/page.tsx": { references: ["Contact", "Lead", "LandParcel", "Project", "Invoice", "Payment", "Expense", "Approval"], primaryRegister: null },
    "projects/page.tsx": { references: ["LandParcel", "Contact", "TeamMember"], primaryRegister: "Projects" },
    "invoices/page.tsx": { references: ["Contact", "Project"], primaryRegister: "Invoices" },
    "leads/page.tsx": { references: ["Contact", "TeamMember"], primaryRegister: "Leads" },
    "land/page.tsx": { references: ["Contact", "TeamMember"], primaryRegister: "LandParcels" },
    "expenses/page.tsx": { references: ["Project", "Contact"], primaryRegister: "Expenses" },
  };
  const registerFunctions = [
    "Contacts",
    "Leads",
    "LandParcels",
    "Projects",
    "TeamMembers",
    "Invoices",
    "Payments",
    "Expenses",
    "Approvals",
  ];

  for (const [relativePage, { references, primaryRegister }] of Object.entries(expectations)) {
    const source = await readProjectFile(path.join("app", "(office)", "office", relativePage));
    for (const reference of references) {
      assert.match(
        source,
        new RegExp(`listOffice${reference}Options\\(`),
        `${relativePage} should load ${reference} selector data through a reference query`,
      );
    }
    for (const register of registerFunctions.filter((name) => name !== primaryRegister)) {
      assert.doesNotMatch(
        source,
        new RegExp(`listOffice${register}\\(`),
        `${relativePage} must not load the full ${register} register for selector data`,
      );
    }
  }
});

test("authentication and authorization lookups are request-memoized", async () => {
  const [chatAuth, cmsAuth, officeAuth] = await Promise.all([
    readProjectFile("app/chatgpt-auth.ts"),
    readProjectFile("features/cms/auth.ts"),
    readProjectFile("features/office/auth.ts"),
  ]);

  assert.match(chatAuth, /export const getChatGPTUser = cache\(readChatGPTUser\)/);
  assert.match(cmsAuth, /const cmsAuthorization = cache\(async/);
  assert.match(cmsAuth, /const getCmsRoleForNormalizedEmail = cache\(async/);
  assert.match(officeAuth, /const getOfficeMembershipByNormalizedEmail = cache\(async/);
  assert.match(officeAuth, /const resolveOfficeActor = cache\(async/);
});

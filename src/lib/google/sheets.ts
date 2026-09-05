import "server-only";

import { google } from "googleapis";
import type { applications } from "@/db/schema";

type Application = typeof applications.$inferSelect;

const defaultSheetName = "Foglio1";

const matchLabels = {
  A_STRONG: "A - Strong",
  B_STRETCH: "B - Stretch",
  C_LONG_SHOT: "C - Long shot",
} as const;

const outcomeLabels = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  OFFER: "Offer",
} as const;

const stageLabels = {
  APPLICATION: "Application",
  RECRUITER_SCREENING: "Recruiter screening",
  HIRING_MANAGER: "Hiring manager",
  TECHNICAL: "Technical",
  CHALLENGE: "Challenge",
  FINAL: "Final",
  OFFER: "Offer",
} as const;

export async function syncApplicationToGoogleSheet(application: Application) {
  const config = getGoogleSheetsConfig();
  const sheets = getGoogleSheetsClient(config);
  await ensureExtendedHeaders(sheets, config);
  const rows = await getExistingRows(sheets, config);

  if (hasEquivalentApplication(rows, application)) {
    return { status: "skipped" as const };
  }

  const contiguousApplicationRows = getContiguousApplicationRows(rows);
  const sheetId = getNextSheetId(contiguousApplicationRows);
  const sheetRow = getFirstFreeApplicationRow(rows);

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `${config.sheetName}!A${sheetRow}:AB${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [toSheetRow(application, sheetId)],
    },
  });

  return { status: "inserted" as const, sheetRow, sheetId };
}

export async function syncUpdatedApplicationToGoogleSheet(application: Application, previousApplication: Application) {
  const config = getGoogleSheetsConfig();
  const sheets = getGoogleSheetsClient(config);
  await ensureExtendedHeaders(sheets, config);
  const rows = await getExistingRows(sheets, config);
  const foundRow = findEquivalentApplicationRow(rows, previousApplication) ?? findEquivalentApplicationRow(rows, application);

  if (!foundRow) {
    return { status: "missing" as const };
  }

  const sheetId = getExistingSheetId(foundRow.row) ?? getNextSheetId(getContiguousApplicationRows(rows));

  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `${config.sheetName}!A${foundRow.sheetRow}:AB${foundRow.sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [toSheetRow(application, sheetId)],
    },
  });

  return { status: "updated" as const, sheetRow: foundRow.sheetRow, sheetId };
}

function getGoogleSheetsConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || defaultSheetName;

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error("Google Sheets sync is not configured");
  }

  return { spreadsheetId, clientEmail, privateKey, sheetName };
}

function getGoogleSheetsClient(config: ReturnType<typeof getGoogleSheetsConfig>) {
  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

async function getExistingRows(sheets: ReturnType<typeof getGoogleSheetsClient>, config: ReturnType<typeof getGoogleSheetsConfig>) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `${config.sheetName}!A:AB`,
  });

  return response.data.values ?? [];
}

function hasEquivalentApplication(rows: unknown[][], application: Application) {
  return findEquivalentApplicationRow(rows, application) !== null;
}

function findEquivalentApplicationRow(rows: unknown[][], application: Application) {
  const appliedDate = formatDate(application.appliedAt);
  const company = normalize(application.company);
  const role = normalize(application.role);

  const rowIndex = rows.findIndex((row) => normalize(row[2]) === company && normalize(row[3]) === role && normalize(row[1]) === appliedDate);

  return rowIndex === -1 ? null : { row: rows[rowIndex], sheetRow: rowIndex + 1 };
}

function getContiguousApplicationRows(rows: unknown[][]) {
  const contiguousRows: unknown[][] = [];

  for (const row of rows.slice(1)) {
    if (!isActualApplicationRow(row)) break;
    contiguousRows.push(row);
  }

  return contiguousRows;
}

function isActualApplicationRow(row: unknown[]) {
  return normalize(row[2]) !== "" || normalize(row[3]) !== "";
}

function getFirstFreeApplicationRow(rows: unknown[][]) {
  const firstDataRow = 2;
  const firstFreeIndex = rows.slice(1).findIndex((row) => normalize(row[2]) === "" && normalize(row[3]) === "");

  return firstFreeIndex === -1 ? rows.length + 1 : firstDataRow + firstFreeIndex;
}

function getNextSheetId(rows: unknown[][]) {
  const maxId = rows.reduce((max, row) => {
    const value = typeof row[0] === "string" || typeof row[0] === "number" ? Number(row[0]) : Number.NaN;
    return Number.isInteger(value) && value > max ? value : max;
  }, 0);

  return maxId + 1;
}

function getExistingSheetId(row: unknown[]) {
  const value = typeof row[0] === "string" || typeof row[0] === "number" ? Number(row[0]) : Number.NaN;
  return Number.isInteger(value) && value > 0 ? value : null;
}

function toSheetRow(application: Application, sheetId: number) {
  return [
    sheetId,
    formatDate(application.appliedAt),
    application.company,
    application.role,
    application.roleCategory ?? "",
    application.seniority ?? "",
    application.country ?? "",
    application.workMode ?? "",
    application.source ?? "",
    application.vacancyUrl ?? "",
    application.cvVersion ?? "",
    application.userMatchClass ? matchLabels[application.userMatchClass] : "",
    application.userMatchPercentage === null ? "" : `${application.userMatchPercentage}%`,
    application.workAuthorization ?? "",
    application.salaryMin ?? "",
    application.salaryMax ?? "",
    application.currency ?? "",
    outcomeLabels[application.outcome],
    stageLabels[application.stage],
    application.responseAt ? formatDate(application.responseAt) : "",
    getDaysToResponse(application),
    application.rejectionReason ?? "",
    application.requirementsAndGaps ?? "",
    application.notes ?? "",
    truncateForSheet(application.jdText ?? ""),
    application.aiMatchClass ? matchLabels[application.aiMatchClass] : "",
    application.aiMatchPercentage === null ? "" : `${application.aiMatchPercentage}%`,
    application.aiMatchConfidence === null ? "" : `${application.aiMatchConfidence}%`,
  ];
}

async function ensureExtendedHeaders(sheets: ReturnType<typeof getGoogleSheetsClient>, config: ReturnType<typeof getGoogleSheetsConfig>) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range: `${config.sheetName}!Y1:AB1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [["JD", "AI Match", "AI Match %", "AI Match Confidence"]] },
  });
}

function truncateForSheet(value: string) {
  return value.length > 45000 ? `${value.slice(0, 45000)}\n[Truncated in Google Sheet; full JD is stored in JobHolmes.]` : value;
}

function getDaysToResponse(application: Application) {
  if (!application.responseAt) return "";
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round((application.responseAt.getTime() - application.appliedAt.getTime()) / millisecondsPerDay));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

// Day 9 — Token Usage Dashboard
// Reads usage_log.csv and prints a formatted summary report
// Usage: node dashboard.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH  = path.join(__dirname, "usage_log.csv");

// ─── CSV Parser ───────────────────────────────────────────────────────────────
// Handles quoted fields (e.g. "hello, world" stays as one field)
function parseCsvLine(line) {
  const fields = [];
  let current  = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }   // escaped quote
      else if (ch === '"') { inQuotes = false; }                         // end quote
      else { current += ch; }
    } else {
      if (ch === '"')  { inQuotes = true; }
      else if (ch === ',') { fields.push(current); current = ""; }       // next field
      else { current += ch; }
    }
  }
  fields.push(current);   // push last field
  return fields;
}

function loadCsv() {
  if (!fs.existsSync(CSV_PATH)) return null;
  const content = fs.readFileSync(CSV_PATH, "utf-8").trim();
  if (!content) return null;
  const lines = content.split("\n");
  if (lines.length < 2) return null;

  // First line = headers, rest = data rows
  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  return lines.slice(1)
    .filter(l => l.trim())        // skip blank lines
    .map(line => {
      const values = parseCsvLine(line);
      const row = {};
      headers.forEach((h, i) => { row[h] = values[i]?.trim() ?? ""; });
      return {
        timestamp:         row["Date & Time"],
        provider:          row["Provider"],
        model:             row["Model"],
        inputTokens:       parseInt(row["Input Tokens"])          || 0,
        outputTokens:      parseInt(row["Output Tokens"])         || 0,
        totalTokens:       parseInt(row["Total Tokens"])          || 0,
        responseTimeMs:    parseInt(row["Response Time (ms)"])    || 0,
        estimatedCostUsd:  parseFloat(row["Estimated Cost (USD)"]?.replace("$", "")) || 0,
        status:            row["Status"],
        promptPreview:     row["Prompt (first 50 chars)"],
      };
    });
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────
const L = (str, len)  => String(str).padEnd(len);   // left-align  in fixed width
const R = (str, len)  => String(str).padStart(len); // right-align in fixed width
const fCost = cost    => "$" + cost.toFixed(4);
const fNum  = n       => n.toLocaleString();
const DIV   = "─".repeat(70);
const THICK = "═".repeat(70);

// ─── Dashboard Sections ───────────────────────────────────────────────────────

function printHeader() {
  console.log("\n" + THICK);
  console.log("                    📊  TOKEN USAGE DASHBOARD");
  console.log("                    " + new Date().toLocaleString());
  console.log(THICK);
}

function printOverallSummary(rows) {
  const successRows = rows.filter(r => r.status?.toLowerCase() === "success");
  const errorRows   = rows.filter(r => r.status?.toLowerCase() === "error");

  const totalInput  = rows.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutput = rows.reduce((s, r) => s + r.outputTokens, 0);
  const totalCost   = rows.reduce((s, r) => s + r.estimatedCostUsd, 0);

  console.log("\n📈  OVERALL SUMMARY");
  console.log(DIV);
  console.log(`  Total Calls    : ${rows.length}  (✅ ${successRows.length} success  ❌ ${errorRows.length} error)`);
  console.log(`  Input Tokens   : ${fNum(totalInput)}`);
  console.log(`  Output Tokens  : ${fNum(totalOutput)}`);
  console.log(`  Total Tokens   : ${fNum(totalInput + totalOutput)}`);
  console.log(`  Total Cost     : ${fCost(totalCost)}`);
}

function printByProvider(rows) {
  const providerList = ["Groq", "Gemini", "Cohere"];

  console.log("\n🔀  BY PROVIDER");
  console.log(DIV);
  console.log(
    "  " +
    L("Provider", 10) + " | " +
    R("Calls", 5)     + " | " +
    R("Input Tok", 10) + " | " +
    R("Output Tok", 11) + " | " +
    R("Avg Time", 9)  + " | " +
    R("Total Cost", 11)
  );
  console.log("  " + "─".repeat(67));

  for (const p of providerList) {
    const pRows = rows.filter(r => r.provider?.toLowerCase() === p.toLowerCase());
    if (pRows.length === 0) continue;

    const calls      = pRows.length;
    const inTok      = pRows.reduce((s, r) => s + r.inputTokens,  0);
    const outTok     = pRows.reduce((s, r) => s + r.outputTokens, 0);
    const cost       = pRows.reduce((s, r) => s + r.estimatedCostUsd, 0);
    const avgTime    = Math.round(pRows.reduce((s, r) => s + r.responseTimeMs, 0) / calls);

    console.log(
      "  " +
      L(p, 10)            + " | " +
      R(calls, 5)         + " | " +
      R(fNum(inTok), 10)  + " | " +
      R(fNum(outTok), 11) + " | " +
      R(avgTime + "ms", 9)+ " | " +
      R(fCost(cost), 11)
    );
  }
}

function printRecentCalls(rows) {
  const recent = rows.slice(-10).reverse();   // last 10, newest first

  console.log("\n🕐  RECENT CALLS  (last 10, newest first)");
  console.log(DIV);
  console.log(
    "  " +
    L("Time", 22)        + " | " +
    L("Provider", 8)     + " | " +
    R("Tokens", 7)       + " | " +
    R("Cost", 8)         + " | " +
    L("St", 4)           + " | " +
    "Prompt"
  );
  console.log("  " + "─".repeat(67));

  for (const r of recent) {
    const icon   = r.status?.toLowerCase() === "success" ? "✅" : "❌";
    const tokens = fNum(r.totalTokens);
    const cost   = fCost(r.estimatedCostUsd);
    const prompt = (r.promptPreview || "").slice(0, 25);

    console.log(
      "  " +
      L(r.timestamp || "N/A", 22) + " | " +
      L(r.provider  || "—",    8) + " | " +
      R(tokens, 7)                + " | " +
      R(cost, 8)                  + " | " +
      icon + "  | " +
      prompt
    );
  }
}

function printFooter() {
  console.log("\n" + THICK + "\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const rows = loadCsv();

if (!rows || rows.length === 0) {
  console.log("\n📭  No usage data yet — run the chatbot first:\n");
  console.log("     node chatbot.js --provider groq\n");
  process.exit(0);
}

printHeader();
printOverallSummary(rows);
printByProvider(rows);
printRecentCalls(rows);
printFooter();

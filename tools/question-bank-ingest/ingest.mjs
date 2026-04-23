import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import * as cheerio from "cheerio";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const CONFIG_PATH = path.join(
  ROOT,
  "tools",
  "question-bank-ingest",
  "sources.json",
);

function normalizeCompany(company) {
  return (company || "general").trim().toLowerCase();
}

function normalizeDifficulty(value) {
  const diff = (value || "medium").trim().toLowerCase();
  return ["easy", "medium", "hard"].includes(diff) ? diff : "medium";
}

function normalizeSource(sourceValue) {
  return String(sourceValue || "unknown")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function looksLikeQuestion(text) {
  const t = (text || "").trim();
  if (!t || t.length < 12) return false;
  if (t.length > 220) return false;
  if (t.endsWith("?")) return true;
  return /(design|implement|tell me about|given|find|build|create)/i.test(t);
}

function extractFrequencyNumber(tips = []) {
  for (const tip of tips) {
    const lower = String(tip || "").toLowerCase();
    if (!lower.includes("frequency")) continue;
    const match = lower.match(/(\d+(\.\d+)?)/);
    if (!match) continue;
    const parsed = Number.parseFloat(match[1]);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

function estimateImportanceScore(questionRecord) {
  const category = String(questionRecord.category || "").toLowerCase();
  const question = String(questionRecord.question || "").toLowerCase();
  const tips = Array.isArray(questionRecord.tips)
    ? questionRecord.tips.map((t) => String(t).toLowerCase())
    : [];
  const tipText = tips.join(" ");

  let score = 50;
  const frequency = extractFrequencyNumber(questionRecord.tips);
  if (frequency !== null) {
    score += Math.min(30, frequency * 0.3);
  }

  const contains = (pattern) =>
    pattern.test(question) || pattern.test(tipText);

  if (contains(/most common|frequently asked|high frequency|top interview/i)) {
    score += 15;
  }
  if (contains(/critical|must-know|core concept/i)) {
    score += 10;
  }

  if (category === "system-design") {
    if (contains(/design\s+(a|an)\s+/i)) score += 10;
    if (contains(/scal|throughput|latency|consistency|availability|partition|cache|queue|load balancer|replication/i)) {
      score += 8;
    }
  } else if (category === "behavioral") {
    if (contains(/tell me about a time|describe a time|give an example/i)) {
      score += 10;
    }
    if (contains(/leadership|conflict|ownership|ambiguity|stakeholder|collaborat|impact/i)) {
      score += 8;
    }
    if (contains(/star/i)) {
      score += 4;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function passesQualityFilter(questionRecord) {
  const category = String(questionRecord.category || "").toLowerCase();
  const question = String(questionRecord.question || "").trim();
  if (!looksLikeQuestion(question)) return false;
  if (question.length < 20 || question.length > 200) return false;

  if (category === "system-design") {
    return /design|scal|architecture|system|service/i.test(question);
  }

  if (category === "behavioral") {
    return /tell me about a time|describe a time|give an example|how do you handle/i.test(
      question,
    );
  }

  return true;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walkFiles(dirPath, matcher) {
  const results = [];
  const stack = [dirPath];
  while (stack.length) {
    const curr = stack.pop();
    for (const entry of fs.readdirSync(curr, { withFileTypes: true })) {
      const full = path.join(curr, entry.name);
      if (entry.isDirectory()) {
        if ([".git", "node_modules"].includes(entry.name)) continue;
        stack.push(full);
      } else if (matcher(full)) {
        results.push(full);
      }
    }
  }
  return results;
}

function parseMarkdownFile(
  filePath,
  fallbackCategory,
  fallbackDifficulty,
  companyOverride,
) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const baseName = path.basename(filePath, path.extname(filePath));
  const company =
    (companyOverride || "").trim() ||
    baseName.replace(/[-_]+/g, " ").trim() ||
    "General";

  const questions = [];
  let currentCategory = fallbackCategory || "leetcode";

  for (const raw of lines) {
    const line = raw.trim();

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      const lower = heading[1].toLowerCase();
      if (lower.includes("behavior")) currentCategory = "behavioral";
      else if (lower.includes("system") || lower.includes("design"))
        currentCategory = "system-design";
      else if (lower.includes("leetcode") || lower.includes("coding"))
        currentCategory = "leetcode";
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(.+)$/);
    if (!bullet) continue;

    const text = bullet[1]
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
      .replace(/`/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!looksLikeQuestion(text)) continue;

    questions.push({
      company,
      category: currentCategory,
      difficulty: fallbackDifficulty || "medium",
      question: text,
      tips: [],
    });
  }

  return questions;
}

function ingestGithubRepoMarkdown(source) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "qbank-"));
  const cloneDir = path.join(tempDir, "repo");

  try {
    execSync(`git clone --depth 1 ${source.repoUrl} "${cloneDir}"`, {
      stdio: "inherit",
    });
  } catch (error) {
    console.warn(
      `Failed to clone source repo ${source.repoUrl}. Skipping source.`,
    );
    return [];
  }

  const mdFiles = walkFiles(cloneDir, (f) => f.endsWith(".md"));
  const all = [];
  const sourceTag = normalizeSource(source.name || source.repoUrl);
  for (const file of mdFiles) {
    const parsed = parseMarkdownFile(
      file,
      source.category,
      source.defaultDifficulty,
      source.company,
    );
    all.push(...parsed.map((entry) => ({ ...entry, source: sourceTag })));
  }

  return all;
}

function parseDelimitedRow(row, delimiter) {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i += 1) {
    const ch = row[i];
    if (ch === '"') {
      const next = row[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      out.push(current);
      current = "";
      continue;
    }

    current += ch;
  }
  out.push(current);
  return out;
}

function parseLeetCodeCsvFile(filePath, fallbackCategory, fallbackDifficulty) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return [];
  }

  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const header = parseDelimitedRow(lines[0], delimiter).map((x) =>
    x.trim().toLowerCase(),
  );

  const titleIndex = header.findIndex(
    (h) => h === "title" || h.includes("title"),
  );
  const difficultyIndex = header.findIndex((h) => h === "difficulty");
  const urlIndex = header.findIndex((h) => h === "url");
  const acceptanceIndex = header.findIndex((h) => h.includes("acceptance"));
  const frequencyIndex = header.findIndex((h) => h.includes("frequency"));

  const company = path.basename(path.dirname(filePath)).trim() || "General";
  const category = fallbackCategory || "leetcode";
  const questions = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseDelimitedRow(lines[i], delimiter).map((x) => x.trim());
    if (cols.length === 0) {
      continue;
    }

    const title = titleIndex >= 0 ? cols[titleIndex] || "" : "";
    if (!title) {
      continue;
    }

    const url = urlIndex >= 0 ? cols[urlIndex] || "" : "";
    const difficulty =
      difficultyIndex >= 0
        ? cols[difficultyIndex] || fallbackDifficulty || "medium"
        : fallbackDifficulty || "medium";
    const acceptance = acceptanceIndex >= 0 ? cols[acceptanceIndex] || "" : "";
    const frequency = frequencyIndex >= 0 ? cols[frequencyIndex] || "" : "";

    const tips = [];
    if (url) tips.push(`LeetCode URL: ${url}`);
    if (acceptance) tips.push(`Acceptance: ${acceptance}`);
    if (frequency) tips.push(`Frequency: ${frequency}`);

    questions.push({
      company,
      category,
      difficulty,
      question: title,
      tips,
    });
  }

  return questions;
}

function ingestGithubRepoCsv(source) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "qbank-"));
  const cloneDir = path.join(tempDir, "repo");

  try {
    execSync(`git clone --depth 1 ${source.repoUrl} "${cloneDir}"`, {
      stdio: "inherit",
    });
  } catch (error) {
    console.warn(
      `Failed to clone source repo ${source.repoUrl}. Skipping source.`,
    );
    return [];
  }

  const wantedName = (source.csvFileName || "all.csv").toLowerCase();
  const csvFiles = walkFiles(
    cloneDir,
    (f) => path.basename(f).toLowerCase() === wantedName,
  );
  const all = [];
  const sourceTag = normalizeSource(source.name || source.repoUrl);
  for (const file of csvFiles) {
    const parsed = parseLeetCodeCsvFile(
      file,
      source.category,
      source.defaultDifficulty,
    );
    all.push(...parsed.map((entry) => ({ ...entry, source: sourceTag })));
  }

  return all;
}

async function ingestWebPages(source) {
  const all = [];
  const pages = source.pages || [];
  const sourceTag = normalizeSource(source.name || "web-pages");

  for (const page of pages) {
    const response = await fetch(page.url);
    if (!response.ok) {
      console.warn(`Skipping ${page.url}, status ${response.status}`);
      continue;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const candidates = [];
    $("li, p, h3, h4").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (looksLikeQuestion(text)) {
        candidates.push(text);
      }
    });

    for (const question of candidates.slice(0, 250)) {
      all.push({
        company: page.company || "General",
        category: source.category || "leetcode",
        difficulty: source.defaultDifficulty || "medium",
        question,
        tips: [],
        source: sourceTag,
      });
    }
  }

  return all;
}

function ingestManualJson(source) {
  const filePath = path.join(ROOT, source.filePath);
  if (!fs.existsSync(filePath)) return [];
  const data = loadJson(filePath);
  if (!Array.isArray(data)) return [];
  const sourceTag = normalizeSource(source.name || source.filePath);
  return data.map((entry) => ({
    ...entry,
    source: normalizeSource(entry.source || sourceTag),
  }));
}

function dedupeQuestions(questions) {
  const merged = new Map();

  for (const q of questions) {
    const company = (q.company || "General").trim();
    const category = (q.category || "leetcode").trim().toLowerCase();
    if (category === "system-design") continue;
    const question = (q.question || "").trim();
    if (!question) continue;
    const tips = Array.isArray(q.tips)
      ? q.tips.map((x) => String(x).trim()).filter(Boolean)
      : [];

    const candidate = {
      company,
      companyNormalized: normalizeCompany(company),
      category,
      difficulty: normalizeDifficulty(q.difficulty),
      question,
      tips,
      source: normalizeSource(q.source),
      importanceScore:
        typeof q.importanceScore === "number" && Number.isFinite(q.importanceScore)
          ? Math.max(0, Math.min(100, Math.round(q.importanceScore)))
          : estimateImportanceScore({
              category,
              question,
              tips,
            }),
    };

    if (!passesQualityFilter(candidate)) continue;

    const key = `${company.toLowerCase()}|${category}|${question.toLowerCase()}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, candidate);
      continue;
    }

    const mergedTips = Array.from(new Set([...(existing.tips || []), ...tips]));
    merged.set(key, {
      ...existing,
      tips: mergedTips,
      importanceScore: Math.max(
        existing.importanceScore || 0,
        candidate.importanceScore || 0,
      ),
      source:
        existing.source && existing.source !== "unknown"
          ? existing.source
          : candidate.source,
    });
  }

  return Array.from(merged.values());
}

async function upsertQuestions(questions) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  const dbNameFromUri = (() => {
    try {
      const url = new URL(uri);
      return url.pathname?.replace(/^\//, "") || "";
    } catch {
      return "";
    }
  })();

  const dbName =
    process.env.QUESTION_BANK_DB || dbNameFromUri || "silicon-defense";
  const collectionName =
    process.env.QUESTION_BANK_COLLECTION || "company_question_bank";

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const col = client.db(dbName).collection(collectionName);

    const ops = questions.map((q) => ({
      updateOne: {
        filter: {
          companyNormalized: q.companyNormalized,
          category: q.category,
          question: q.question,
        },
        update: {
          $set: {
            company: q.company,
            companyNormalized: q.companyNormalized,
            category: q.category,
            difficulty: q.difficulty,
            question: q.question,
            tips: q.tips,
            source: q.source || "unknown",
            importanceScore: q.importanceScore ?? 50,
          },
        },
        upsert: true,
      },
    }));

    if (ops.length === 0) {
      console.log("No question records to upsert.");
      return;
    }

    const result = await col.bulkWrite(ops, { ordered: false });
    console.log(
      `Upserted question bank records. matched=${result.matchedCount}, modified=${result.modifiedCount}, upserted=${result.upsertedCount}`,
    );
  } finally {
    await client.close();
  }
}

async function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Missing config: ${CONFIG_PATH}`);
  }

  const config = loadJson(CONFIG_PATH);
  const sources = config.sources || [];

  let all = [];
  for (const source of sources) {
    console.log(`Ingesting source: ${source.name || source.type}`);

    try {
      if (source.type === "github-repo-markdown") {
        all = all.concat(ingestGithubRepoMarkdown(source));
      } else if (source.type === "github-repo-csv") {
        all = all.concat(ingestGithubRepoCsv(source));
      } else if (source.type === "manual-json") {
        all = all.concat(ingestManualJson(source));
      } else if (source.type === "web-pages") {
        all = all.concat(await ingestWebPages(source));
      } else {
        console.warn(`Unknown source type: ${source.type}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Source failed (${source.name || source.type}): ${message}`);
    }
  }

  const deduped = dedupeQuestions(all);
  console.log(
    `Collected ${all.length} raw records, ${deduped.length} unique records.`,
  );
  await upsertQuestions(deduped);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

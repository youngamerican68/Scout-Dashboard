#!/usr/bin/env node
/**
 * journal-scout.js
 *
 * Fetches recent academic papers from PubMed and Semantic Scholar,
 * generates a structured markdown report with two categories:
 *   1. Health & Longevity Insights
 *   2. Business & Product Opportunities
 *
 * Usage:
 *   node journal-scout.js
 *   node journal-scout.js --days 14  # look back 14 days instead of 7
 *
 * Output: reports/journal-report-YYYY-MM-DD.md
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const REPORTS_DIR =
  process.env.JOURNAL_OUTPUT_DIR ||
  path.join(__dirname, "reports");

const DAYS_BACK = parseInt(process.argv.find((a) => a === "--days")
  ? process.argv[process.argv.indexOf("--days") + 1]
  : "7", 10);

const MAX_PER_QUERY = 10;

// --- Search Queries ---

const HEALTH_QUERIES = [
  "longevity intervention human",
  "aging reversal therapy",
  "metabolic health biomarker",
  "cognitive enhancement supplement",
  "mental health treatment novel",
  "sleep optimization",
  "exercise physiology aging",
  "nutrition longevity",
  "gut microbiome health",
  "stress resilience psychology",
];

const BUSINESS_QUERIES = [
  "artificial intelligence product application",
  "automation workflow software",
  "biotechnology commercial application",
  "wearable health technology",
  "personalized medicine platform",
  "energy storage innovation",
  "human computer interaction design",
  "natural language processing application",
];

// --- HTTP Helpers ---

function fetch(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : require("http");
    lib.get(url, { headers: { "User-Agent": "ClawdbotJournalScout/1.0" } }, (res) => {
      if (res.statusCode === 429) {
        reject(new Error("Rate limited (429)"));
        return;
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    }).on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- PubMed ---

async function searchPubMed(query, daysBack) {
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - daysBack);
  const minStr = minDate.toISOString().slice(0, 10).replace(/-/g, "/");
  const maxStr = new Date().toISOString().slice(0, 10).replace(/-/g, "/");

  const searchUrl =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed` +
    `&term=${encodeURIComponent(query)}&retmax=${MAX_PER_QUERY}&retmode=json` +
    `&datetype=pdat&mindate=${minStr}&maxdate=${maxStr}&sort=relevance`;

  try {
    const res = await fetch(searchUrl);
    const data = JSON.parse(res.body);
    return data.esearchresult?.idlist || [];
  } catch (err) {
    console.error(`PubMed search failed for "${query}":`, err.message);
    return [];
  }
}

async function fetchPubMedDetails(ids) {
  if (ids.length === 0) return [];

  const url =
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed` +
    `&id=${ids.join(",")}&retmode=xml`;

  try {
    const res = await fetch(url);
    return parsePubMedXml(res.body);
  } catch (err) {
    console.error("PubMed fetch failed:", err.message);
    return [];
  }
}

function parsePubMedXml(xml) {
  const papers = [];
  const articles = xml.split("<PubmedArticle>");

  for (let i = 1; i < articles.length; i++) {
    const art = articles[i];

    const title = extractTag(art, "ArticleTitle") || "Untitled";
    const abstract = extractTag(art, "AbstractText") || "";
    const journal = extractTag(art, "Title") || "";
    const pmid = extractTag(art, "PMID") || "";

    // Extract publication date
    const yearMatch = art.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
    const monthMatch = art.match(/<PubDate>[\s\S]*?<Month>(\w+)<\/Month>/);
    const pubDate = yearMatch
      ? `${yearMatch[1]}${monthMatch ? " " + monthMatch[1] : ""}`
      : "Recent";

    // Extract authors
    const authorMatches = art.match(/<LastName>([^<]+)<\/LastName>/g) || [];
    const authors = authorMatches
      .slice(0, 3)
      .map((m) => m.replace(/<\/?LastName>/g, ""))
      .join(", ");

    if (abstract.length > 50) {
      papers.push({
        title,
        abstract: abstract.slice(0, 1000),
        journal,
        authors: authors ? (authorMatches.length > 3 ? `${authors} et al.` : authors) : "Unknown",
        pubDate,
        doi: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        source: "PubMed",
        category: "health",
      });
    }
  }

  return papers;
}

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : null;
}

// --- Semantic Scholar ---

async function searchSemanticScholar(query, daysBack) {
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - daysBack);
  const minStr = minDate.toISOString().slice(0, 10);

  const url =
    `https://api.semanticscholar.org/graph/v1/paper/search` +
    `?query=${encodeURIComponent(query)}&limit=${MAX_PER_QUERY}` +
    `&fields=title,abstract,authors,venue,year,citationCount,externalIds,publicationDate` +
    `&publicationDateOrYear=${minStr}:`;

  try {
    const res = await fetch(url);
    if (res.status !== 200) {
      console.error(`Semantic Scholar returned ${res.status} for "${query}"`);
      return [];
    }
    const data = JSON.parse(res.body);
    return (data.data || [])
      .filter((p) => p.abstract && p.abstract.length > 50)
      .map((p) => ({
        title: p.title || "Untitled",
        abstract: (p.abstract || "").slice(0, 1000),
        journal: p.venue || "Preprint",
        authors: (p.authors || [])
          .slice(0, 3)
          .map((a) => a.name)
          .join(", ") + (p.authors?.length > 3 ? " et al." : ""),
        pubDate: p.publicationDate || `${p.year || "Recent"}`,
        doi: p.externalIds?.DOI
          ? `https://doi.org/${p.externalIds.DOI}`
          : `https://www.semanticscholar.org/paper/${p.paperId}`,
        citations: p.citationCount || 0,
        source: "Semantic Scholar",
        category: "business",
      }));
  } catch (err) {
    console.error(`Semantic Scholar search failed for "${query}":`, err.message);
    return [];
  }
}

// --- Deduplication ---

function dedup(papers) {
  const seen = new Set();
  return papers.filter((p) => {
    const key = p.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// --- Report Generation ---

function generateReport(healthPapers, businessPapers, stats) {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [];

  lines.push(`# Journal Scout Report — ${date}`);
  lines.push("");
  lines.push(
    `Scanned ${stats.totalPapers} papers from PubMed and Semantic Scholar (last ${DAYS_BACK} days). ` +
    `Found ${healthPapers.length} health/longevity insights and ${businessPapers.length} business opportunities.`
  );
  lines.push("");

  // Health section
  lines.push("---");
  lines.push("");
  lines.push("## Health & Longevity Insights");
  lines.push("");

  if (healthPapers.length === 0) {
    lines.push("No notable papers found this period.");
    lines.push("");
  } else {
    for (const paper of healthPapers) {
      lines.push(`### ${paper.title}`);
      lines.push("");
      lines.push(
        `**${paper.journal}** | ${paper.authors} | ${paper.pubDate}`
      );
      lines.push(`**Link:** ${paper.doi}`);
      lines.push("");
      lines.push(paper.abstract);
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  // Business section
  lines.push("## Business & Product Opportunities");
  lines.push("");

  if (businessPapers.length === 0) {
    lines.push("No notable papers found this period.");
    lines.push("");
  } else {
    for (const paper of businessPapers) {
      lines.push(`### ${paper.title}`);
      lines.push("");
      lines.push(
        `**${paper.journal}** | ${paper.authors} | ${paper.pubDate}` +
        (paper.citations ? ` | ${paper.citations} citations` : "")
      );
      lines.push(`**Link:** ${paper.doi}`);
      lines.push("");
      lines.push(paper.abstract);
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}

// --- Main ---

async function main() {
  console.log(`Journal Scout — scanning last ${DAYS_BACK} days`);
  console.log("");

  // Ensure output dir exists
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  let totalPapers = 0;

  // 1. Fetch health papers from PubMed
  console.log("Fetching health/longevity papers from PubMed...");
  const allHealthIds = new Set();
  for (const query of HEALTH_QUERIES) {
    const ids = await searchPubMed(query, DAYS_BACK);
    ids.forEach((id) => allHealthIds.add(id));
    console.log(`  "${query}" → ${ids.length} results`);
    await sleep(400); // PubMed rate limit: ~3 req/sec without API key
  }

  console.log(`  Total unique PubMed IDs: ${allHealthIds.size}`);
  totalPapers += allHealthIds.size;

  const healthPapers = await fetchPubMedDetails([...allHealthIds]);
  console.log(`  Papers with abstracts: ${healthPapers.length}`);

  await sleep(1000);

  // 2. Fetch business papers from Semantic Scholar
  console.log("");
  console.log("Fetching business/product papers from Semantic Scholar...");
  let businessPapers = [];
  for (const query of BUSINESS_QUERIES) {
    const papers = await searchSemanticScholar(query, DAYS_BACK);
    businessPapers.push(...papers);
    console.log(`  "${query}" → ${papers.length} results`);
    totalPapers += papers.length;
    await sleep(1100); // Semantic Scholar: 1 req/sec for unauthenticated
  }

  // Deduplicate
  businessPapers = dedup(businessPapers);
  console.log(`  Unique business papers: ${businessPapers.length}`);

  // 3. Generate report
  const report = generateReport(
    dedup(healthPapers).slice(0, 15),
    businessPapers.slice(0, 15),
    { totalPapers }
  );

  const date = new Date().toISOString().slice(0, 10);
  const filename = `journal-report-${date}.md`;
  const filepath = path.join(REPORTS_DIR, filename);

  fs.writeFileSync(filepath, report);
  console.log("");
  console.log(`Report saved: ${filepath}`);
  console.log(
    `  ${dedup(healthPapers).length} health papers, ${businessPapers.length} business papers`
  );

  // 4. Auto-sync if sync script is available
  const syncScript = path.join(
    "/root/.openclaw/workspace/twitter-scout",
    "sync-to-tracker.js"
  );
  if (fs.existsSync(syncScript) && process.env.SCOUT_TRACKER_URL) {
    console.log("");
    console.log("Syncing to Scout Tracker dashboard...");
    try {
      const { execSync } = require("child_process");
      execSync(`node "${syncScript}" "${filepath}"`, {
        stdio: "inherit",
        timeout: 30000,
      });
    } catch (err) {
      console.error("Sync failed:", err.message);
    }
  }
}

main().catch((err) => {
  console.error("Journal Scout error:", err.message);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * sync-to-tracker.js
 *
 * Drop this into /root/.openclaw/workspace/twitter-scout/
 * Call it after analyzer.js finishes to push results to the Scout Tracker dashboard.
 *
 * Usage:
 *   node sync-to-tracker.js reports/report-2026-02-07.md
 *   node sync-to-tracker.js reports/report-2026-02-07.json
 *
 * Env vars required:
 *   SCOUT_TRACKER_URL  - Your Vercel dashboard URL
 *   SCOUT_TRACKER_KEY  - API key for authentication
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const TRACKER_URL = process.env.SCOUT_TRACKER_URL;
const API_KEY = process.env.SCOUT_TRACKER_KEY;

if (!TRACKER_URL || !API_KEY) {
  console.error('Missing env vars. Set SCOUT_TRACKER_URL and SCOUT_TRACKER_KEY');
  process.exit(1);
}

function post(endpoint, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, TRACKER_URL);
    const lib = url.protocol === 'https:' ? https : http;

    const data = JSON.stringify(body);
    const req = lib.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Parse the markdown report into a title, content, and opportunity list
function parseMarkdownReport(content) {
  const lines = content.split('\n');

  // Extract title from first heading
  const titleLine = lines.find(l => l.startsWith('# '));
  const title = titleLine ? titleLine.replace(/^#+\s*/, '').trim() : 'Scout Report';

  // Detect source
  const lowerContent = content.toLowerCase();
  const isJournal = lowerContent.includes('journal') || lowerContent.includes('pubmed') ||
    lowerContent.includes('semantic scholar') || lowerContent.includes('doi:') ||
    lowerContent.includes('longevity') && lowerContent.includes('paper');
  const isPodcast = lowerContent.includes('podcast') || lowerContent.includes('transcript');
  const source = isJournal ? 'journal' : isPodcast ? 'podcast' : lowerContent.includes('discord') ? 'discord' : 'twitter';

  // Count tweets/posts mentioned
  const tweetMatch = content.match(/(\d+)\s*(tweets?|posts?|results?)/i);
  const tweetCount = tweetMatch ? parseInt(tweetMatch[1], 10) : null;

  // Extract opportunities - look for sections with BUILD NOW, HIGH, or bulleted items
  const opportunities = [];
  const oppPatterns = [
    /(?:BUILD NOW|HIGH PRIORITY|OPPORTUNITY)[:\s]*(.+)/gi,
    /(?:^|\n)[-*]\s*\*\*(.+?)\*\*[:\s]*(.+)/g,
    /(?:^|\n)###?\s*(?:\d+\.\s*)?(.+)/g,
  ];

  // Try to find structured opportunities from JSON sections or markdown lists
  const sections = content.split(/\n(?=#{1,3}\s)/);
  let reachedEnd = false;
  for (const section of sections) {
    const sectionTitle = section.match(/^#{1,3}\s*(.+)/);
    if (!sectionTitle) continue;

    const heading = sectionTitle[1].trim();
    // Stop extracting once we hit pattern summary or opportunities recap
    if (/pattern summary|opportunities\s*\(|bottom line/i.test(heading)) {
      reachedEnd = true;
      continue;
    }
    if (reachedEnd) continue;
    // Skip meta sections
    if (/summary|overview|intro|metadata|config/i.test(heading)) continue;

    const sectionBody = section.replace(/^#{1,3}\s*.+\n/, '').trim();
    if (sectionBody.length > 20) {
      // Determine priority from Clawdbot's Priority: line, or fallback to keyword detection
      let priority = 'backlog';
      const priorityLine = section.match(/Priority:\s*(?:🔴|🟡|⚪|⛔|🟢)?\s*(.+)/i);
      if (priorityLine) {
        const p = priorityLine[1].toLowerCase();
        if (/build now|immediate/i.test(p)) priority = 'build_now';
        else if (/backlog|add to backlog|explore|investigate/i.test(p)) priority = 'backlog';
        else if (/skip|none|dismiss|not a build/i.test(p)) priority = 'skip';
        else if (/\bmonitor\b|watch|track/i.test(p)) priority = 'monitor';
      } else {
        if (/build now|high priority|urgent/i.test(section)) priority = 'build_now';
        if (/low priority|maybe|someday|monitor/i.test(section)) priority = 'monitor';
      }

      opportunities.push({
        title: heading.replace(/^\d+\.\s*/, ''),
        description: sectionBody,
        source,
        priority,
      });
    }
  }

  return { title, content, source, tweetCount, opportunities };
}

// Parse JSON analysis output (from analyzer.js)
function parseJsonReport(content) {
  const data = JSON.parse(content);

  const title = data.title || data.reportTitle || `Scout Analysis - ${new Date().toLocaleDateString()}`;
  const source = data.source || 'twitter';
  const tweetCount = data.tweetCount || data.totalTweets || null;
  const body = data.summary || data.content || JSON.stringify(data, null, 2);

  const opportunities = [];
  const items = data.opportunities || data.findings || data.signals || data.items || [];

  for (const item of items) {
    opportunities.push({
      title: (item.title || item.name || item.whatItIs || 'Untitled'),
      description: (item.description || item.opportunity || item.summary || ''),
      source,
      priority: (item.priority || item.difficulty === 'easy' ? 'build_now' : 'backlog'),
    });
  }

  return { title, content: body, source, tweetCount, opportunities };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node sync-to-tracker.js <report-file>');
    process.exit(1);
  }

  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(fullPath, 'utf-8');
  const isJson = fullPath.endsWith('.json');

  let parsed;
  try {
    parsed = isJson ? parseJsonReport(raw) : parseMarkdownReport(raw);
  } catch (err) {
    console.error('Failed to parse report:', err.message);
    process.exit(1);
  }

  console.log(`Syncing: "${parsed.title}" (${parsed.opportunities.length} opportunities)`);

  // 1. Create the scout report
  const report = await post('/api/reports', {
    source: parsed.source,
    date: new Date().toISOString(),
    title: parsed.title,
    content: parsed.content,
    tweetCount: parsed.tweetCount,
  });

  console.log(`Created report: ${report.id}`);

  // 2. Create linked opportunities
  for (const opp of parsed.opportunities) {
    const created = await post('/api/opportunities', {
      ...opp,
      reportId: report.id,
    });
    console.log(`  + Opportunity: "${created.title}"`);
  }

  console.log(`Done! ${parsed.opportunities.length} opportunities synced to Scout Tracker.`);
}

main().catch(err => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});

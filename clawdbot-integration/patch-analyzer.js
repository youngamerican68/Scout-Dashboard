const fs = require('fs');
const f = '/root/.openclaw/workspace/twitter-scout/analyzer.js';
const code = fs.readFileSync(f, 'utf-8');

const oldStr = '  return report;\n}';

const newStr = `  // Sync to Scout Tracker dashboard
  try {
    const { execSync } = require("child_process");
    execSync(\`node /root/.openclaw/workspace/twitter-scout/sync-to-tracker.js \${readablePath}\`, { stdio: "inherit", timeout: 30000 });
  } catch (err) {
    console.error("Scout Tracker sync failed:", err.message);
  }

  return report;
}`;

if (code.includes(oldStr)) {
  fs.writeFileSync(f, code.replace(oldStr, newStr));
  console.log('Patched analyzer.js successfully!');
} else {
  console.log('Pattern not found - analyzer.js may already be patched or has changed');
}

#!/bin/bash
source /etc/environment
export SCOUT_TRACKER_URL SCOUT_TRACKER_KEY

TWITTER_DIR="/root/.openclaw/workspace/twitter-scout"
JOURNAL_DIR="/root/.openclaw/workspace/journal-scout"
SYNC_SCRIPT="$TWITTER_DIR/sync-to-tracker.js"
LAST_SYNC_FILE="$TWITTER_DIR/.last-sync"

if [ -f "$LAST_SYNC_FILE" ]; then
  LAST_SYNC=$(cat "$LAST_SYNC_FILE")
else
  LAST_SYNC=0
fi

# Sync Twitter scout reports
for report in "$TWITTER_DIR"/reports/scout-report-*.md; do
  [ -f "$report" ] || continue
  MOD_TIME=$(stat -c %Y "$report")
  if [ "$MOD_TIME" -gt "$LAST_SYNC" ]; then
    echo "Syncing Twitter report: $report"
    node "$SYNC_SCRIPT" "$report"
  fi
done

# Sync Journal scout reports
for report in "$JOURNAL_DIR"/reports/journal-report-*.md; do
  [ -f "$report" ] || continue
  MOD_TIME=$(stat -c %Y "$report")
  if [ "$MOD_TIME" -gt "$LAST_SYNC" ]; then
    echo "Syncing Journal report: $report"
    node "$SYNC_SCRIPT" "$report"
  fi
done

date +%s > "$LAST_SYNC_FILE"

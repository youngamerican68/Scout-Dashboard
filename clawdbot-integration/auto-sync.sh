#!/bin/bash
source /etc/environment
export SCOUT_TRACKER_URL SCOUT_TRACKER_KEY

SYNC_DIR="/root/.openclaw/workspace/twitter-scout"
LAST_SYNC_FILE="$SYNC_DIR/.last-sync"

if [ -f "$LAST_SYNC_FILE" ]; then
  LAST_SYNC=$(cat "$LAST_SYNC_FILE")
else
  LAST_SYNC=0
fi

for report in "$SYNC_DIR"/reports/scout-report-*.md; do
  [ -f "$report" ] || continue
  MOD_TIME=$(stat -c %Y "$report")
  if [ "$MOD_TIME" -gt "$LAST_SYNC" ]; then
    echo "Syncing: $report"
    node "$SYNC_DIR/sync-to-tracker.js" "$report"
  fi
done

date +%s > "$LAST_SYNC_FILE"

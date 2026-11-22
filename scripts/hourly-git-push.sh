#!/usr/bin/env bash
# Automated hourly git push script for hackathon progress
cd "$(dirname "$0")/.." || exit 1

TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
LOG_FILE=".git/hourly-push.log"

if [[ -n $(git status --porcelain) ]]; then
  echo "[$TIMESTAMP] Changes detected, staging safe changes..." >> "$LOG_FILE"
  git add -A
  git commit -m "feat(auto-sync): hourly hackathon progress [$TIMESTAMP]" >> "$LOG_FILE" 2>&1
  git push origin main >> "$LOG_FILE" 2>&1
  echo "[$TIMESTAMP] Push complete." >> "$LOG_FILE"
else
  echo "[$TIMESTAMP] Working tree clean, nothing to commit." >> "$LOG_FILE"
fi

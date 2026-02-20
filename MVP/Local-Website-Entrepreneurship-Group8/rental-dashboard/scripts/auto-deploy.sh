#!/bin/bash
# Auto-deploy script: checks GitHub for new commits every 60 seconds.
# If changes are found, pulls, rebuilds, and restarts the Next.js server.

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="/tmp/rental-auto-deploy.log"
PIDFILE="/tmp/rental-next-server.pid"
CHECK_INTERVAL=60  # seconds

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

start_server() {
  cd "$PROJECT_DIR"
  # Kill existing server if running
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    log "Stopping existing server (PID $(cat "$PIDFILE"))..."
    kill "$(cat "$PIDFILE")" 2>/dev/null
    sleep 3
    # Force kill if still running
    kill -9 "$(cat "$PIDFILE")" 2>/dev/null
  fi

  log "Starting Next.js server..."
  NODE_ENV=production nohup node node_modules/.bin/next start >> /tmp/rental-dashboard.log 2>&1 &
  echo $! > "$PIDFILE"
  log "Server started (PID $(cat "$PIDFILE"))"
}

deploy() {
  cd "$PROJECT_DIR"
  log "New commits detected, deploying..."

  # Pull latest code
  git pull origin main >> "$LOG_FILE" 2>&1
  if [ $? -ne 0 ]; then
    log "ERROR: git pull failed"
    return 1
  fi

  # Install ALL dependencies (devDependencies needed for build: tailwindcss, typescript, etc.)
  npm ci >> "$LOG_FILE" 2>&1

  # Clean old build artifacts to prevent stale chunks
  rm -rf .next

  # Rebuild
  log "Building..."
  npm run build >> "$LOG_FILE" 2>&1
  if [ $? -ne 0 ]; then
    log "ERROR: build failed"
    return 1
  fi

  # Restart server
  start_server
  log "Deploy complete!"
}

# --- Main loop ---
log "=== Auto-deploy started for $PROJECT_DIR ==="
log "Checking every ${CHECK_INTERVAL}s for new commits..."

cd "$PROJECT_DIR"

# Build and start server on first run if not already running
if ! [ -f "$PIDFILE" ] || ! kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  log "First run: installing dependencies and building..."
  npm ci >> "$LOG_FILE" 2>&1
  rm -rf .next
  npm run build >> "$LOG_FILE" 2>&1
  if [ $? -ne 0 ]; then
    log "ERROR: initial build failed"
    exit 1
  fi
  start_server
fi

while true; do
  cd "$PROJECT_DIR"

  # Fetch latest from remote (without merging)
  git fetch origin main --quiet 2>/dev/null

  # Compare local HEAD with remote HEAD
  LOCAL=$(git rev-parse HEAD 2>/dev/null)
  REMOTE=$(git rev-parse origin/main 2>/dev/null)

  if [ "$LOCAL" != "$REMOTE" ]; then
    deploy
  fi

  sleep "$CHECK_INTERVAL"
done

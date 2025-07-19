#\!/bin/bash
# Commit Manager Monitoring Script
# Checks every 30 seconds for error count changes

BASELINE=133
LAST_COUNT=133
COMMIT_INTERVAL=300 # 5 minutes in seconds
LAST_COMMIT_TIME=$(date +%s)

echo "🔧 Commit Manager: Monitoring TypeScript error reduction..."
echo "📊 Baseline: $BASELINE errors"
echo "⏰ Next scheduled commit: $(date -d "@$((LAST_COMMIT_TIME + COMMIT_INTERVAL)))"

while true; do
  # Check current error count
  ERROR_COUNT=$(npm run build 2>&1 | grep -c 'error TS' || echo 0)
  CURRENT_TIME=$(date +%s)
  TIME_SINCE_COMMIT=$((CURRENT_TIME - LAST_COMMIT_TIME))
  
  if [ $ERROR_COUNT -lt $LAST_COUNT ]; then
    REDUCTION=$((LAST_COUNT - ERROR_COUNT))
    echo "📉 Error reduction detected: $REDUCTION errors fixed ($ERROR_COUNT remaining)"
    
    # If 10+ errors fixed, commit immediately
    if [ $REDUCTION -ge 10 ]; then
      echo "🚀 Triggering immediate commit (10+ errors fixed)"
      # Trigger commit here
    fi
    LAST_COUNT=$ERROR_COUNT
  fi
  
  # Time-based commit (every 5 minutes)
  if [ $TIME_SINCE_COMMIT -ge $COMMIT_INTERVAL ]; then
    echo "⏰ 5-minute interval reached - checking for any changes"
    # Trigger commit here
    LAST_COMMIT_TIME=$CURRENT_TIME
  fi
  
  sleep 30
done

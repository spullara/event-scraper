#!/bin/bash

# Check SSL certificate status for grabcal.com

echo "🔍 Checking SSL certificate status for grabcal.com..."
echo ""

MAX_ATTEMPTS=20
ATTEMPT=1
SLEEP_TIME=30

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "Attempt $ATTEMPT/$MAX_ATTEMPTS ($(date '+%H:%M:%S'))"
  
  # Try to connect with HTTPS
  RESULT=$(curl -I https://grabcal.com 2>&1)
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! SSL certificate is active!"
    echo ""
    echo "Response headers:"
    echo "$RESULT" | head -15
    echo ""
    echo "🎉 Your site is now live at https://grabcal.com"
    exit 0
  else
    # Check what kind of error
    if echo "$RESULT" | grep -q "SSL_ERROR_SYSCALL"; then
      echo "   ⏳ SSL certificate not ready yet (SSL_ERROR_SYSCALL)"
    elif echo "$RESULT" | grep -q "certificate"; then
      echo "   ⏳ Certificate issue: $(echo "$RESULT" | grep -i certificate | head -1)"
    else
      echo "   ⏳ Connection issue: $(echo "$RESULT" | grep -i error | head -1)"
    fi
  fi
  
  if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    echo "   Waiting ${SLEEP_TIME} seconds before next check..."
    sleep $SLEEP_TIME
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
done

echo ""
echo "⚠️  SSL certificate not ready after $MAX_ATTEMPTS attempts"
echo "This is taking longer than expected. You may need to:"
echo "1. Verify the domain in Vercel dashboard"
echo "2. Check https://vercel.com/spullaras-projects/event-scraper/settings/domains"
echo ""
echo "Current DNS status:"
dig +short grabcal.com


#!/bin/bash

# Add grabcal.com to the Vercel project
# This script uses the Vercel CLI to add the domain

echo "Adding grabcal.com to Vercel project..."

# Get the project ID
PROJECT_ID=$(vercel project ls --json 2>/dev/null | jq -r '.[] | select(.name=="event-scraper") | .id')

if [ -z "$PROJECT_ID" ]; then
  echo "Error: Could not find project ID for event-scraper"
  exit 1
fi

echo "Project ID: $PROJECT_ID"

# Try to add the domain using vercel CLI
echo "Attempting to add domain via CLI..."
vercel domains add grabcal.com --yes 2>&1

echo ""
echo "Domain should now be added. Checking status..."
sleep 2

# Check if domain was added
vercel domains ls

echo ""
echo "Next steps:"
echo "1. Wait for SSL certificate to be provisioned (can take 5-10 minutes)"
echo "2. Test with: curl -I https://grabcal.com"
echo "3. If SSL doesn't work, you may need to verify the domain in the Vercel dashboard"


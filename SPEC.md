# GrabCal - Event Scraper Specification

## Overview
A bookmarklet and API service that extracts event information from web pages and generates calendar links with proper timezone handling.

**Live at: https://grabcal.com**

## Components

### 1. Bookmarklet
- Extracts content from the current page
- Priority order:
  1. First tries structured event markup (Schema.org JSON-LD, Microdata, Open Graph, hCalendar)
  2. If no events found, retries with plain text extraction
- Sends extracted content + browser timezone to Vercel API
- Displays results in an in-page modal overlay

### 2. Vercel API
- Uses Vercel AI SDK with Google Gemini 2.5 Flash Lite
- Structured outputs using Zod schemas
- Extracts timezone information from event text
- Falls back to browser timezone if not specified
- Returns HTML with:
  - Event details
  - Google Calendar URL (with timezone parameter)
  - ICS download link (with timezone info)
  - Error message if no event found
  - Multiple event selection UI (up to 5 events)

## Detailed Specification

### Bookmarklet Behavior

1. **Event markup extraction** (priority order):
   - Schema.org Event markup (JSON-LD, Microdata)
   - Open Graph tags
   - iCalendar/hCalendar microformats

2. **Smart Retry Logic**:
   - First attempt: Send structured data to API
   - If no events found: Retry with plain text extraction
   - This ensures fast response when structured data exists, with fallback for plain text

3. **Timezone Detection**:
   - Captures browser timezone using `Intl.DateTimeFormat().resolvedOptions().timeZone`
   - Sends to API for use as fallback when event doesn't specify timezone

4. **User Experience**:
   - Click bookmarklet → extract content → call API
   - Display results in an in-page modal overlay (not popup window)
   - Modal shows event(s) with clickable calendar links
   - Console logging for debugging (extraction method, content length, API responses)
   - Close button and click-outside-to-close functionality

### API Specification

#### Endpoint
- Public API (no authentication)
- Single endpoint: `/api/extract-event`
- Deployed at: `https://grabcal.com/api/extract-event`

#### Request
- Method: POST
- Content-Type: application/json
- Payload:
```json
{
  "text": "extracted page content",
  "browserTimezone": "America/Los_Angeles"
}
```

#### Response
- Returns HTML to display directly in modal
- HTML contains:
  - Event details (title, date/time, location, description)
  - Google Calendar URL with timezone parameter (`ctz`)
  - ICS file download link with timezone info
  - Error messages if no event found
  - Multiple event selection UI (up to 5 events)

#### Processing
- Uses Vercel AI SDK with structured outputs
- Model: Google Gemini 2.5 Flash Lite
- Zod schema for type-safe event extraction
- Extracts timezone from event text (e.g., "PST", "EST", "America/Los_Angeles")
- Falls back to browser timezone if not specified
- Preserves local time (does NOT convert to UTC)
- Generates calendar URLs with proper timezone parameters

#### Timezone Handling
- AI extracts timezone from event text when available
- Uses browser timezone as fallback
- Calendar links include `ctz` parameter for Google Calendar
- ICS files include `TZID` field
- Dates formatted in local time (YYYYMMDDTHHmmss) not UTC (no 'Z' suffix)

#### Error Handling
- Returns user-friendly HTML error messages
- Console logging for debugging
- Graceful fallback from structured data to plain text

### Technical Stack
- **Frontend**: Vanilla JavaScript bookmarklet (IIFE pattern)
- **Backend**: Vercel serverless function (Node.js 18+)
- **AI**: Vercel AI SDK + Google Gemini 2.5 Flash Lite
- **Deployment**: Vercel + AWS Route 53
- **Domain**: grabcal.com
- **Environment**: Gemini API key in Vercel env vars

### Calendar URL Formats

1. **Google Calendar URL**: Primary format
   - Format: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...&location=...&ctz=...`
   - Includes `ctz` parameter for timezone (e.g., `America/Los_Angeles`)
   - Dates in local time format: `YYYYMMDDTHHmmss` (no 'Z' suffix)

2. **ICS File**: Secondary format
   - Data URL with .ics content
   - Includes `TZID` field for timezone
   - Dates in local time format
   - PRODID: `-//Event Scraper//EN`

### Response Scenarios
1. **Single event found**: Display event with calendar links
2. **Multiple events found**: Display list for user selection (up to 5)
3. **No event found in structured data**: Automatically retry with plain text
4. **No event found at all**: Display error message with debugging hint
5. **API error**: Display error message

## Implementation Status

### ✅ Completed
- Vercel project structure
- `/api/extract-event` endpoint with Gemini 2.5 Flash Lite
- Event extraction with Zod schemas and structured outputs
- Timezone extraction and preservation
- Google Calendar URL generation with timezone
- ICS file generation with timezone
- HTML response generation
- Bookmarklet with structured data extraction
- Smart retry logic (structured data → plain text fallback)
- In-page modal UI (not popup window)
- Loading states and error handling
- Console logging for debugging
- Multiple events support
- Custom domain setup (grabcal.com)
- DNS configuration with AWS Route 53
- SSL certificate provisioning
- Production deployment and testing
- Timezone handling tests

### 📁 Project Structure
```
event-scraper/
├── api/extract-event.js          # API endpoint
├── bookmarklet/bookmarklet.js    # Bookmarklet source
├── public/
│   ├── index.html                # Installation page
│   └── test-event.html           # Test page
├── scripts/                      # Build and validation scripts
├── tests/                        # Test files
└── docs/                         # Documentation (README, SPEC, DOMAIN-SETUP)
```

## Design Decisions
- **Modal styling**: Clean, centered overlay with backdrop
- **Event limit**: Maximum 5 events displayed
- **API timeout**: 30 seconds
- **Timezone handling**: Preserve local time, don't convert to UTC
- **Retry logic**: Try structured data first, fallback to plain text
- **Console logging**: Comprehensive debugging information
- **Domain**: grabcal.com (short, memorable, action-oriented)

## Status
✅ **Fully implemented and deployed at https://grabcal.com**


# Event Scraper Specification

## Overview
An application to extract event information from web pages and generate calendar URLs.

## Components

### 1. Bookmarklet
- Grabs text from the current page
- Priority order:
  1. First look for event markup (structured data)
  2. Fallback to plain text extraction
- Sends extracted content to Vercel API

### 2. Vercel API
- Uses Vercel AI SDK
- LLM: gemini-2.5-flash-lite
- Uses JSON return format for parseable output
- Returns one of:
  - Calendar URL to add the event
  - Error message (no event found)
  - List of events for user selection (if multiple events detected)

## Detailed Specification

### Bookmarklet Behavior
1. **Event markup extraction** (priority order):
   - Schema.org Event markup (JSON-LD, Microdata)
   - Open Graph tags
   - iCalendar/hCalendar microformats

2. **Fallback**: Extract all page text if no structured markup found

3. **User Experience**:
   - Click bookmarklet → extract content → call API
   - Display results in a popup window
   - Popup shows event(s) with clickable links
   - Links open in new tab to add to Google Calendar

### API Specification

#### Endpoint
- Public API (no authentication for now)
- Single endpoint: `/api/extract-event`

#### Request
- Method: POST
- Payload: `{ "text": "extracted page content" }`
- Content extracted from page (markup or plain text)

#### Response
- Returns HTML to display directly in popup
- HTML contains:
  - Event details
  - Google Calendar URL links
  - ICS file download links (if possible)
  - Error messages if no event found
  - Multiple events if detected (user can select)

#### Processing
- Uses Vercel AI SDK
- Model: gemini-2.5-flash-lite
- JSON mode for structured output
- Parses event information from text
- Generates calendar URLs

#### Error Handling
- High detail error messages during development
- Clear user-facing messages in HTML response

### Technical Stack
- **Frontend**: Vanilla JavaScript bookmarklet
- **Backend**: Vercel serverless function
- **AI**: Vercel AI SDK + Gemini 2.5 Flash Lite
- **Environment**: Gemini API key in Vercel env vars

### Calendar URL Formats
1. **Google Calendar URL**: Primary format
   - Format: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...&location=...`

2. **ICS File**: Secondary format (if feasible)
   - Generate .ics file content
   - Provide download link

### Response Scenarios
1. **Single event found**: Display event with calendar links
2. **Multiple events found**: Display list for user selection
3. **No event found**: Display error message
4. **Parse error**: Display detailed error for debugging

## Implementation Plan

### Phase 1: API Development
1. Set up Vercel project structure
2. Create `/api/extract-event` endpoint
3. Integrate Vercel AI SDK with Gemini
4. Implement event extraction logic with JSON mode
5. Generate Google Calendar URLs
6. Generate ICS file content (if feasible)
7. Return HTML response for popup display

### Phase 2: Bookmarklet Development
1. Create event markup extraction logic (Schema.org, OG, hCalendar)
2. Implement text fallback extraction
3. Create API call to backend
4. Build popup UI to display results
5. Handle loading states and errors
6. Minify bookmarklet code

### Phase 3: Testing & Deployment
1. Test with various event pages
2. Test with pages without events
3. Test with multiple events
4. Deploy to Vercel
5. Generate final bookmarklet code with production API URL

## Design Decisions
- **Popup styling**: Clean and simple
- **Event limit**: Maximum 5 events displayed
- **API timeout**: 30 seconds

## Ready to Implement
All specifications finalized. Ready to begin development.


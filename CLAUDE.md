# LinkedIn Job Analyzer Chrome Extension

## Project Overview
A Chrome extension that uses AI to generate structured summaries of LinkedIn job postings, helping job seekers efficiently evaluate opportunities.

## Development Commands
```bash
# Load extension in Chrome
# 1. Navigate to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select this directory

# Test the extension
# 1. Navigate to any LinkedIn job posting
# 2. Click extension icon
# 3. Test both predefined and custom format options

# Package for distribution (if needed)
zip -r linkedin-job-analyzer.zip . -x "*.git*" "CLAUDE.md" "user-story-job-summary.md"
```

## File Structure

- `manifest.json` - Extension configuration and permissions
- `popup.html/js` - Extension popup interface and logic
- `content.js` - LinkedIn page content extraction script
- `background.js` - AI service integration and message handling
- `options.html/js` - Settings page for API key configuration
- `icons/` - Extension icons (16x16, 48x48, 128x128 needed)

## Key Features Implemented

✅ Detects LinkedIn job posting pages automatically
✅ Extracts job data using multiple selector strategies for robustness
✅ Provides predefined summary format with customizable sections (title, company, salary, location, benefits, skills, culture)
✅ Supports custom format with natural language prompts
✅ Integrates with latest AI models: OpenAI GPT-4.1 mini and Anthropic Claude Sonnet 4
✅ Bilingual support (English/Italian) with language preference persistence
✅ Secure local storage for API keys and settings
✅ Fallback mock responses when API is unavailable
✅ Intelligent prompt engineering that only includes selected sections
✅ Technical terms preservation in Italian responses

## Setup Instructions

1. Configure AI API key in extension options (right-click extension → Options)
2. Choose between OpenAI (GPT-4.1 mini) or Anthropic (Claude Sonnet 4) as AI provider
3. Select preferred language (English/Italian) in settings
4. API keys and preferences are stored locally and encrypted by Chrome

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup appears on LinkedIn job pages
- [ ] Content extraction works on various job posting layouts
- [ ] Predefined format generates only selected sections (no extra fields)
- [ ] Custom format respects user instructions
- [ ] API key validation works correctly
- [ ] Language switching works immediately (EN/IT)
- [ ] Italian responses preserve technical English terms
- [ ] Settings persistence across browser sessions
- [ ] Error handling displays helpful messages in correct language

## Known Limitations

- Requires manual API key setup (no built-in AI service)
- LinkedIn layout changes may require selector updates
- Rate limits depend on chosen AI provider (GPT-4.1 mini or Claude Sonnet 4)
- Mock responses used when API unavailable
- First-time usage requires proper API key initialization

## Claude code behavior

- Use frequently the WebFetch, WebSearch and MCP tools
- When using external libraries, ALWAYS use WebFetch tool to ensure you use them correctly.

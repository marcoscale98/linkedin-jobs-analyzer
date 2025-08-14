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
✅ Provides predefined summary format (title, company, salary, location, benefits)
✅ Supports custom format with natural language prompts
✅ Integrates with OpenAI GPT and Anthropic Claude APIs
✅ Secure local storage for API keys
✅ Fallback mock responses when API is unavailable

## Setup Instructions
1. Configure AI API key in extension options (right-click extension → Options)
2. Choose between OpenAI or Anthropic as AI provider
3. API keys are stored locally and encrypted by Chrome

## Testing Checklist
- [ ] Extension loads without errors
- [ ] Popup appears on LinkedIn job pages
- [ ] Content extraction works on various job posting layouts
- [ ] Predefined format generates proper bullet points
- [ ] Custom format respects user instructions
- [ ] API key validation works correctly
- [ ] Error handling displays helpful messages

## Known Limitations
- Requires manual API key setup (no built-in AI service)
- LinkedIn layout changes may require selector updates
- Rate limits depend on chosen AI provider
- Mock responses used when API unavailable

## Future Enhancements
- Add icon files for professional appearance
- Implement caching to reduce API calls
- Add export options (copy to clipboard, save as file)
- Support additional job sites beyond LinkedIn
- Add job comparison features
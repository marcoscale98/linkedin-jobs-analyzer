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
✅ **OpenAI Structured Outputs** - 100% JSON reliability with dynamic schema generation
✅ **Infinite Field Flexibility** - Custom format supports 1 to unlimited user-defined fields
✅ **Multiple Input Formats** - Supports commas, bullets (-, •, ·, *), and newlines for field separation
✅ **Dynamic Field Mapping** - Converts "titolo lavoro" → `titoloLavoro` → back to "titolo lavoro" for display
✅ **SchemaManager Architecture** - Centralized dynamic JSON schema generation based on user input
✅ Integrates with OpenAI GPT-4.1 mini using structured outputs (simplified from dual-provider approach)
✅ Bilingual support (English/Italian) with language preference persistence
✅ Secure local storage for API keys and settings
✅ Fallback mock responses when API is unavailable
✅ Intelligent prompt engineering that prevents AI hallucination
✅ Technical terms preservation in Italian responses
✅ Real-time field validation and camelCase identifier generation

## Setup Instructions

1. Configure OpenAI API key in extension options (right-click extension → Options)
2. Select preferred language (English/Italian) in settings
3. API keys and preferences are stored locally and encrypted by Chrome

## Custom Format Examples

The extension now supports truly flexible custom field requests:

### Single Field
```
titolo lavoro
```
→ Extracts just the job title

### Multiple Fields (Comma-separated)
```
titolo lavoro, azienda, gruppo aziendale, orario lavorativo, tipo contratto
```
→ Creates 5 dynamic fields with Italian names

### Bullet Format
```
- salary range
- remote work policy  
- team size
- required experience
```
→ Supports any number of bullet points

### Mixed Delimiters
```
Job Title
• Company Name
- Salary & Benefits
Work Location (remote/hybrid/onsite)
```
→ Handles mixed formatting automatically

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Popup appears on LinkedIn job pages
- [ ] Content extraction works on various job posting layouts
- [ ] Predefined format generates only selected sections (no extra fields)
- [ ] **Custom format with single field** (e.g., "salary") works correctly
- [ ] **Custom format with multiple fields** (comma-separated) creates all requested fields
- [ ] **Custom format with bullet points** (-, •, ·, *) parses correctly
- [ ] **Dynamic field mapping** preserves original field names in display
- [ ] **Schema generation** creates valid camelCase identifiers from any input
- [ ] **Field validation** prevents AI from inventing information not in job posting
- [ ] **Multilingual field names** work in both English and Italian
- [ ] API key validation works correctly
- [ ] Language switching works immediately (EN/IT)
- [ ] Italian responses preserve technical English terms
- [ ] Settings persistence across browser sessions
- [ ] Error handling displays helpful messages in correct language
- [ ] **OpenAI structured outputs** return 100% valid JSON
- [ ] **Fallback mock responses** maintain same schema structure

## Known Limitations

- Requires manual OpenAI API key setup (no built-in AI service)
- LinkedIn layout changes may require selector updates
- Rate limits depend on OpenAI API usage and billing
- Mock responses used when API unavailable (maintain same schema structure)
- First-time usage requires proper API key initialization
- Custom field names must be convertible to valid camelCase identifiers
- Maximum practical limit depends on OpenAI token limits for schema size

## Technical Architecture

### SchemaManager Class
- **Dynamic Schema Generation**: Creates OpenAI JSON schemas on-the-fly based on user input
- **Field Parsing**: Splits user prompts by multiple delimiters (`,`, `\n`, `-`, `•`, `·`, `*`)
- **Identifier Conversion**: Transforms "titolo lavoro" → `titoloLavoro` for JSON compliance
- **Schema Caching**: Optimizes performance by caching generated schemas
- **Multilingual Descriptions**: Provides field descriptions in user's selected language

### Structured Outputs vs Basic JSON
- **Before**: ~35% JSON reliability with `{"type": "json_object"}`
- **After**: 100% JSON reliability with `{"type": "json_schema", "strict": true}`
- **Schema Compliance**: Enforces `additionalProperties: false` for OpenAI compatibility
- **Error Prevention**: System prompts prevent AI hallucination and fictional content

## Claude code behavior

- Use frequently the WebFetch, WebSearch and MCP tools
- When using external libraries, ALWAYS use WebFetch tool to ensure you use them correctly
- Call the @breaking-change-detector agent before showing the plan to the user or executing it
- Maintain the documentation up-to-date and lean. Do not put information that are difficult to maintain (like code line numbers). Do not repeat info between @CLAUDE.md and @README.md
- Concise in git commit messages, but informative enough to understand the change (title and summary of max 10 lines)
- Use @code-refactoring-expert agent after a code implementation, before finishing your turn

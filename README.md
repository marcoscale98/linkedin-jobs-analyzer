# LinkedIn Job Analyzer Chrome Extension

A Chrome extension that uses AI to generate structured summaries of LinkedIn job postings, helping job seekers efficiently evaluate opportunities.

## Features

- **Predefined Format**: Get standardized summaries with customizable sections (job title, company, salary, location, benefits, skills, culture)
- **Flexible Custom Format**: Request any number of fields using natural language with infinite flexibility
  - Single field: `"salary"`
  - Multiple fields: `"titolo lavoro, azienda, gruppo aziendale, orario lavorativo"`
  - Bullet format: `"- team size\n- remote policy\n- required skills"`
  - Mixed delimiters: Support for commas, newlines, dashes, and bullets (-, •, ·, *)
- **OpenAI Structured Outputs**: 100% JSON reliability using GPT-4.1 mini with dynamic schema generation
- **Multilingual Support**: English and Italian interfaces with intelligent technical term preservation
- **LinkedIn Integration**: Works seamlessly with LinkedIn job posting pages
- **Smart Field Mapping**: Converts user field names to valid identifiers and back for display

## Installation

1. Download or clone this repository
2. Install dependencies: `npm install`
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extension directory
6. Configure your AI API key in the extension options

## Setup

1. Right-click the extension icon and select "Options"
2. Enter your OpenAI API key (get from [OpenAI Platform](https://platform.openai.com/api-keys))
3. Save your settings

## Usage

1. Navigate to any LinkedIn job posting (`linkedin.com/jobs/view/...`)
2. Click the extension icon in your browser toolbar
3. Choose your summary format:
   - **Predefined Format**: Select specific sections from checkboxes (title, company, salary, location, benefits, skills, culture)
   - **Custom Format**: Enter any fields you want in natural language
4. Click "Generate Summary" to get an AI-powered analysis

### Custom Format Examples

**Italian Job Analysis:**
```
titolo lavoro, azienda, sede di lavoro, tipo contratto, esperienza richiesta
```

**Technical Focus:**
```
- Required programming languages
- Team structure and size
- Remote work policy
- Salary range
- Growth opportunities
```

**Quick Overview:**
```
Company, Location, Salary
```

**Comprehensive Analysis:**
```
Job Title
• Company Background
- Compensation Package
- Work Environment (remote/hybrid/onsite)
- Required Experience Level
- Team Dynamics
- Career Growth Potential
```

## Example Output

### Predefined Format
Selected sections (Title, Company, Salary, Location, Benefits):
```
Titolo Lavoro: Senior Software Engineer
Azienda: Tech Corp
Stipendio: €80.000 - €120.000
Luogo di Lavoro: Remoto / Milano, IT
Benefit: Assicurazione sanitaria, buoni pasto, ferie flessibili
```

### Custom Format Examples

**Input:** `"titolo lavoro, azienda, tipo contratto, orario lavorativo"`
```
Titolo lavoro: Senior Software Engineer
Azienda: Tech Corp
Tipo contratto: Tempo indeterminato
Orario lavorativo: Full-time, flessibile
```

**Input:** `"- programming languages\n- team size\n- remote policy"`
```
Programming languages: JavaScript, TypeScript, React, Node.js
Team size: 8 engineers in the development team
Remote policy: Fully remote with optional office access
```

**Input:** `"Company Background, Growth Opportunities, Work-Life Balance"`
```
Company Background: Fast-growing fintech startup founded in 2019
Growth Opportunities: Career advancement path to Lead Engineer role
Work-Life Balance: Flexible hours, unlimited PTO, no overtime expectations
```

## File Structure

```
linkedin-jobs-analyzer/
├── src/                   # Source files
│   ├── popup.html         # Extension popup interface
│   ├── popup.js           # Popup logic and UI interactions
│   ├── content.js         # LinkedIn page content extraction
│   ├── background.js      # AI service integration + SchemaManager
│   ├── options.html       # Settings page
│   └── options.js         # Settings management
├── test/                  # Test suites
│   ├── setup.js           # Global test setup and Chrome API mocking
│   ├── SchemaManager.test.js       # Schema generation tests
│   ├── LinkedInJobExtractor.test.js # Content extraction tests
│   ├── OptionsManager.test.js      # Settings management tests
│   └── simple.test.js     # Core functionality tests
├── manifest.json          # Extension configuration
├── package.json           # Dependencies and test scripts
├── vitest.config.js       # Test framework configuration
├── CLAUDE.md              # Project documentation
└── README.md              # This file
```

## Testing

Run the comprehensive test suite to verify functionality:

```bash
npm test                # Run tests in watch mode
npm run test:run       # Single test run
npm run test:coverage  # Generate coverage report
npm run test:ui        # Interactive test UI
```

### Test Coverage
- **SchemaManager**: Dynamic schema generation, field parsing, caching, multilingual support
- **LinkedInJobExtractor**: Content extraction, multiple selector strategies, error handling
- **OptionsManager**: Settings management, API key validation, storage operations  
- **Core Functions**: URL detection, API key validation, text processing, summary formatting

## Technical Details

- **Manifest Version**: 3
- **Permissions**: activeTab, scripting, storage
- **AI Service**: OpenAI GPT-4.1 mini with structured outputs (`json_schema` + `strict: true`)
- **Schema Generation**: Dynamic JSON schema creation based on user input via SchemaManager class
- **Field Processing**: Automatic parsing of multiple delimiters and camelCase conversion
- **Content Extraction**: Multiple selector strategies for robust LinkedIn data extraction
- **Storage**: Chrome storage API for secure API key management
- **JSON Reliability**: 100% valid JSON output (vs ~35% with basic JSON mode)
- **Multilingual**: Full English/Italian support with technical term preservation
- **Testing Framework**: Vitest with native Chrome API mocking and comprehensive coverage

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

### Testing Framework
- **Vitest**: Modern JavaScript testing framework (2-5x faster than Jest)
- **Native Vitest mocks**: Chrome extension API mocking for isolated unit tests
- **JSDOM**: DOM environment simulation for browser-based testing
- **Coverage**: Comprehensive test coverage across all major components
- **Mocking Strategy**: Chrome APIs, fetch requests, and DOM manipulation properly mocked

## Privacy & Security

- API keys are stored locally using Chrome's storage API
- No data is sent to third parties except OpenAI for AI processing
- Job posting content is only processed temporarily for summary generation
- All communication uses HTTPS

## Troubleshooting

- **Extension not working**: Ensure you're on a LinkedIn job posting page (`linkedin.com/jobs/view/...`)
- **No summary generated**: Check that your OpenAI API key is configured correctly in Options
- **Extraction issues**: Try refreshing the LinkedIn page and ensure it's fully loaded
- **Custom fields not working**: Verify your field names can be converted to valid identifiers
- **Schema errors**: Ensure your custom format doesn't exceed OpenAI token limits
- **Invalid JSON responses**: The extension uses structured outputs for 100% reliability - check API key validity
- **Language issues**: Switch language in the popup to match your preference (EN/IT)

## Development

To contribute or modify:

1. Install dependencies: `npm install`
2. Make changes to the source files in `src/`
3. Run tests: `npm run test:run` or `npm run test:coverage`
4. Reload the extension in `chrome://extensions/`
5. Test on various LinkedIn job postings
6. Submit pull requests for improvements

## Known Limitations

- Requires manual OpenAI API key setup (no built-in AI service)
- LinkedIn layout changes may require selector updates
- Rate limits depend on OpenAI API usage and billing
- Mock responses used when API unavailable (maintain same schema structure)
- First-time usage requires proper API key initialization
- Custom field names must be convertible to valid camelCase identifiers
- Maximum practical limit depends on OpenAI token limits for schema size

## License

MIT License - see LICENSE file for details
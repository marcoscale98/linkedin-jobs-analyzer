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
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. Configure your AI API key in the extension options

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
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.js               # Popup logic and UI interactions
├── content.js             # LinkedIn page content extraction
├── background.js          # AI service integration + SchemaManager
├── options.html           # Settings page
├── options.js             # Settings management
├── CLAUDE.md              # Project documentation
├── workflow-generate-summary.md  # Technical workflow documentation
└── README.md              # This file
```

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

1. Make changes to the source files
2. Reload the extension in `chrome://extensions/`
3. Test on various LinkedIn job postings
4. Submit pull requests for improvements

## License

MIT License - see LICENSE file for details
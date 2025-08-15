# LinkedIn Job Analyzer Chrome Extension

A Chrome extension that uses AI to generate structured summaries of LinkedIn job postings, helping job seekers efficiently evaluate opportunities.

## Features

- **Predefined Format**: Get standardized summaries with job title, company, salary, location, and benefits
- **Custom Format**: Describe what you want to focus on in natural language (e.g., "Focus on technical requirements and team structure")
- **AI-Powered**: Uses OpenAI GPT-4.1 mini for intelligent content extraction and formatting with structured JSON output
- **LinkedIn Integration**: Works seamlessly with LinkedIn job posting pages

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
   - **Predefined Format**: Standard bullet-point summary
   - **Custom Format**: Describe your preferences in natural language
4. Click "Generate Summary" to get an AI-powered analysis

## Example Output

### Predefined Format
Structured JSON output automatically formatted for display:
```
Job Title: Senior Software Engineer
Company: Tech Corp
Salary: $120,000 - $150,000
Location: Remote / San Francisco, CA
Benefits: Health insurance, 401k matching, unlimited PTO
Required Skills: React, Node.js, TypeScript, 5+ years experience
Team Culture: Collaborative environment, startup culture
```

### Custom Format
For the prompt "Focus on technical requirements and team structure", the JSON response is automatically formatted:
```
Job Title: Senior Software Engineer
Company: Tech Corp
Required Skills: 5+ years experience with React and Node.js, TypeScript, GraphQL, AWS cloud services
Team Culture: Team of 8 engineers, report to Engineering Manager, collaborate with Product and Design teams, mentoring junior developers expected
```

## File Structure

```
linkedin-jobs-analyzer/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.js               # Popup logic and UI interactions
├── content.js             # LinkedIn page content extraction
├── background.js          # AI service integration
├── options.html           # Settings page
├── options.js             # Settings management
└── README.md              # This file
```

## Technical Details

- **Manifest Version**: 3
- **Permissions**: activeTab, scripting, storage
- **AI Service**: OpenAI GPT-4.1 mini with structured JSON output
- **Content Extraction**: Multiple selector strategies for robust data extraction
- **Storage**: Chrome storage API for secure API key management

## Privacy & Security

- API keys are stored locally using Chrome's storage API
- No data is sent to third parties except OpenAI for AI processing
- Job posting content is only processed temporarily for summary generation
- All communication uses HTTPS

## Troubleshooting

- **Extension not working**: Ensure you're on a LinkedIn job posting page
- **No summary generated**: Check that your API key is configured correctly
- **Extraction issues**: Try refreshing the LinkedIn page and ensure it's fully loaded

## Development

To contribute or modify:

1. Make changes to the source files
2. Reload the extension in `chrome://extensions/`
3. Test on various LinkedIn job postings
4. Submit pull requests for improvements

## License

MIT License - see LICENSE file for details
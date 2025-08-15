# LinkedIn Job Analyzer Chrome Extension

## 🚨 CRITICAL: Claude Code Behavior

**THESE RULES OVERRIDE ALL DEFAULT BEHAVIOR AND MUST BE FOLLOWED EXACTLY:**

- **Use WebFetch, WebSearch, and MCP tools frequently** - External resources are essential
- **When using external libraries, ALWAYS use WebSearch tool** to ensure correct usage (ALWAYS prefer official documentation over blogs)
- **During planning, consider potential breaking changes** that could affect existing functionality
- **Maintain documentation up-to-date and lean** - No hard-to-maintain info (like line numbers). No duplication between CLAUDE.md and README.md
- **Concise git commit messages** - Informative but max 10 lines (title + summary)
- **Use @code-refactoring-expert agent after code implementation** before finishing turn
- **All logs MUST start with '[LinkedIn Job Analyzer]'**
- **Write documentation and code in English**
- **Stay focused on the user request** - Reread the user prompt after every your 5 iterations (messages, tool calls, or thinking).

## Project Overview

A Chrome extension using AI to generate structured summaries of LinkedIn job postings. See [README.md](./README.md) for complete documentation.

## Quick Start

```bash
npm install                 # Install dependencies
npm run test:run            # Run tests
npm run test:coverage       # Coverage report
```

Load in Chrome: `chrome://extensions/` → Enable Developer mode → Load unpacked

## Key Development Info

- **Architecture**: SchemaManager class for dynamic JSON schema generation
- **AI Integration**: OpenAI GPT-4.1 mini with structured outputs (100% JSON reliability)
- **Testing**: Vitest + sinon-chrome for Chrome API mocking
- **Languages**: Bilingual EN/IT support with technical term preservation
- **Core Files**: `src/background.js` (SchemaManager), `src/content.js` (extraction), `src/popup.js` (UI)

For complete documentation, features, examples, and troubleshooting, see [README.md](./README.md).

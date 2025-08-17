# LinkedIn Job Analyzer Chrome Extension

## 🚨 CRITICAL: Claude Code Behavior

**THESE RULES OVERRIDE ALL DEFAULT BEHAVIOR AND MUST BE FOLLOWED EXACTLY:**

## General Rules

- **Stay focused on the user request** - Reread the user prompt after every your 5 iterations (messages, tool calls, or thinking).

## During planning or troubleshooting

- **ALWAYS Use WebFetch, WebSearch, and MCP tools when**:
  - You are dealing with libraries, APIs, or external resources
- **During planning, consider potential breaking changes** that could affect existing functionality

## During coding

- **All logs MUST start with '[LinkedIn Job Analyzer]'**
- **Write documentation and code in English**

## Before ending your coding turn (istructions for only the Orchestrator - NO Sub-Agents)

Before ending your coding turn:

- Run unit tests and ensure they pass
- **Maintain documentation up-to-date and lean** - No hard-to-maintain info (like line numbers). No duplication between CLAUDE.md and README.md
- **Use @code-refactoring-expert agent to eventually refactor the code changed in this turn** before finishing turn and then run tests again. DO NOT refactor code that was not changed in this turn, unless explicitly requested.
- At the end, **always commit your changes** with a concise message - Informative but max 10 lines (title + summary)

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
- **Testing**: Vitest with native Chrome API mocking (no external dependencies)
- **Languages**: Bilingual EN/IT support with technical term preservation
- **Core Files**: `src/background.js` (SchemaManager), `src/content.js` (extraction), `src/popup.js` (UI)

For complete documentation, features, examples, and troubleshooting, see [README.md](./README.md).

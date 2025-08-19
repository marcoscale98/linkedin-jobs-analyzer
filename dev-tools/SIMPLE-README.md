# Simple Log Bridge 📡

Stream LinkedIn Job Analyzer console logs to your terminal for development.

## Quick Start

1. **Add console bridge to extension:**
```bash
npm run add-bridge
```

2. **Start log server:**
```bash
npm run logs
```

3. **Reload your Chrome extension** and use it normally

4. **See logs in terminal** - only `[LinkedIn Job Analyzer]` logs will appear

## Commands

```bash
npm run logs         # Start log server
npm run add-bridge   # Add bridge to extension files  
npm run remove-bridge # Remove bridge from extension files
```

## How it works

- **simple-log-server.js**: HTTP server on port 8000 that receives logs
- **console-bridge.js**: Injected into extension, intercepts console logs
- Only logs containing `[LinkedIn Job Analyzer]` are sent to terminal
- Server shows colored output: 🔴 errors, 🟡 warnings, 🟢 info

## Example output

```
🚀 LinkedIn Job Analyzer - Simple Log Server
📡 Server running on http://localhost:8000
--------------------------------------------------
Extension logs will appear here...

[10:30:15] INFO [LinkedIn Job Analyzer] Extension loaded
[10:30:20] LOG [LinkedIn Job Analyzer] Processing job page
[10:30:22] ERROR [LinkedIn Job Analyzer] Failed to extract job data
```

That's it! Simple and focused on just streaming your extension logs.
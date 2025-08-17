# Neural Log Bridge System 🧠

**Advanced real-time log streaming and AI-powered debugging assistance for LinkedIn Job Analyzer Chrome Extension**

## 🚀 Quick Start

```bash
# Start the complete log bridge system
npm run dev

# Or run components separately
npm run inject-bridge    # Inject bridge into extension
npm run log-bridge      # Start log server
```

## 🏗️ Architecture

The Neural Log Bridge consists of four innovative components:

### 1. **Neural Log Bridge Server** (`log-bridge-server.js`)
- **WebSocket + HTTP server** with real-time log streaming
- **Pattern recognition** for Chrome extension specific issues
- **AI escalation** for critical problems
- **Real-time analysis** and trend detection

### 2. **Quantum Bridge** (`quantum-bridge.js`)
- **Multi-context logging** across all Chrome extension contexts
- **Automatic context detection** (background, content script, popup)
- **Secure log sanitization** to protect sensitive data
- **Fallback mechanisms** (WebSocket → HTTP)

### 3. **Security Layer** (`security-layer.js`)
- **Zero-trust architecture** with encryption and integrity checks
- **Advanced sanitization** of API keys, personal data, tokens
- **Security audit logging** with suspicious activity detection
- **Enterprise-grade security** for log data

### 4. **Claude Code Integration** (`claude-integration.js`)
- **AI-powered log analysis** with pattern recognition
- **Automated debugging reports** with actionable suggestions
- **Critical issue escalation** directly to Claude Code
- **Knowledge base** of Chrome extension best practices

## 🎯 Features

### Real-Time Monitoring
- ✅ Live log streaming from all extension contexts
- ✅ WebSocket with HTTP fallback
- ✅ Color-coded log levels and context indicators
- ✅ Pattern-based error detection

### Security & Privacy
- ✅ Automatic sanitization of sensitive data (API keys, tokens)
- ✅ Encryption for secure log transport
- ✅ Integrity checking with checksums
- ✅ Security audit trail

### AI-Powered Analysis
- ✅ Real-time pattern recognition
- ✅ Critical issue escalation to Claude Code
- ✅ Automated debugging suggestions
- ✅ Chrome extension specific knowledge base

### Developer Experience
- ✅ One-command setup and teardown
- ✅ Automatic injection into extension files
- ✅ Rich terminal output with emojis and colors
- ✅ Web-based status dashboard

## 📋 Usage Guide

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development mode:**
   ```bash
   npm run dev
   ```
   This will:
   - Inject the Quantum Bridge into your extension files
   - Start the Neural Log Bridge server
   - Enable real-time log streaming

3. **Reload your Chrome extension** in `chrome://extensions/`

4. **View logs** in your terminal - they'll stream automatically!

### Manual Commands

```bash
# Bridge Management
npm run inject-bridge     # Inject bridge into extension files
npm run remove-bridge     # Remove bridge from extension files  
npm run bridge-status     # Check injection status

# Log Server
npm run log-bridge        # Start log bridge server only

# Development
npm run dev              # Full development setup
npm run dev:clean        # Clean up bridge injections
```

### Shell Scripts

```bash
# Direct script usage
./dev-tools/inject-bridge.sh inject   # Inject bridge
./dev-tools/inject-bridge.sh remove   # Remove bridge
./dev-tools/inject-bridge.sh status   # Check status
./dev-tools/inject-bridge.sh help     # Show help
```

## 🔧 Configuration

### Environment Variables

```bash
LOG_BRIDGE_PORT=3847     # Set server port (default: 3847)
NODE_ENV=development     # Environment mode
```

### Server Configuration

The server automatically configures itself, but you can customize:

```javascript
// In start-log-bridge.js
const config = {
  port: 3847,
  enableSecurity: true,
  enableClaudeIntegration: true,
  logLevel: 'info'
};
```

## 📊 Dashboard & Monitoring

### Web Interface
Visit `http://localhost:3847` for:
- Live connection status
- Log statistics
- Error patterns
- AI analysis queue

### Terminal Output
Rich terminal interface with:
- **🟢 Green**: Successful operations and info logs
- **🟡 Yellow**: Warnings and potential issues  
- **🔴 Red**: Errors requiring attention
- **🤖 AI indicators**: Claude analysis and suggestions

## 🤖 Claude Code Integration

### Automatic Escalation
Critical issues automatically trigger Claude assistance:

```
🤖 CLAUDE CODE ASSISTANCE NEEDED 🤖
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Debugging Report: dev-tools/reports/debugging-report-2025-01-15T10-30-00.json

💡 Run this command to get Claude's help:
   claude read dev-tools/reports/debugging-report-2025-01-15T10-30-00.md "Help me debug these Chrome extension issues"
```

### Manual Analysis
Trigger Claude analysis manually:

```bash
# Analyze recent logs
node -e "
const integration = require('./dev-tools/claude-integration');
const claude = new integration();
// Analyze logs and generate report
"
```

## 🔒 Security Features

### Data Protection
- **API Key Sanitization**: Automatically redacts `sk-*` patterns
- **Personal Data Protection**: Removes emails, SSNs, credit cards
- **URL Sanitization**: Cleans tokens from URLs
- **Field-Level Security**: Protects sensitive object properties

### Audit Trail
- Security events logging
- Suspicious activity detection
- Integrity verification
- Encryption status monitoring

## 🐛 Debugging Features

### Chrome Extension Specific
- **Manifest V3 Issues**: Service worker problems
- **Content Script Errors**: DOM injection issues  
- **API Integration**: OpenAI and network failures
- **LinkedIn Specific**: Page structure changes

### Pattern Recognition
- **Error Clustering**: Groups similar errors
- **Performance Issues**: Detects slow operations
- **Cross-Context Problems**: Issues spanning multiple contexts
- **Rate Limiting**: API throttling detection

## 📁 File Structure

```
dev-tools/
├── log-bridge-server.js      # Main server with WebSocket/HTTP
├── quantum-bridge.js         # Multi-context logging client
├── security-layer.js         # Encryption and sanitization
├── claude-integration.js     # AI analysis and escalation
├── start-log-bridge.js       # Orchestration and CLI
├── inject-bridge.sh          # Bridge injection script
├── reports/                  # Generated debugging reports
├── logs/                     # Session logs and backups
└── README.md                 # This documentation
```

## 🚨 Troubleshooting

### Common Issues

**Bridge not connecting:**
```bash
# Check if server is running
curl http://localhost:3847

# Check injection status  
npm run bridge-status

# Restart everything
npm run dev:clean && npm run dev
```

**Logs not appearing:**
```bash
# Verify extension console logs
# Check Chrome DevTools → Extensions → Inspect views
console.log('[LinkedIn Job Analyzer] Test log');
```

**Permission errors:**
```bash
# Make injection script executable
chmod +x dev-tools/inject-bridge.sh

# Check manifest.json permissions
grep -A 5 -B 5 "localhost" manifest.json
```

### Advanced Debugging

**Enable verbose logging:**
```bash
NODE_ENV=development LOG_LEVEL=debug npm run log-bridge
```

**Check WebSocket connection:**
```javascript
// In browser console
const ws = new WebSocket('ws://localhost:3847');
ws.onopen = () => console.log('Connected to Neural Bridge');
```

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Terminal startup message** with server details
2. **Extension connection logs** when you reload the extension
3. **Real-time log streaming** from your extension
4. **AI analysis** for error patterns
5. **Claude escalation** for critical issues

## 💡 Tips & Best Practices

### Development Workflow
1. Start with `npm run dev` for full setup
2. Keep the log bridge running during development
3. Use `npm run dev:clean` when switching branches
4. Check `npm run bridge-status` if logs stop flowing

### Security Best Practices
- Never commit files with bridge injections
- Use `.backup.*` files to restore original code
- Review generated reports before sharing
- Keep the log bridge on localhost only

### Performance Optimization
- The bridge automatically limits log buffer size
- WebSocket connection provides minimal overhead
- Security layer adds ~5% processing overhead
- Claude integration runs asynchronously

---

**🧠 Built with innovation by the Neural Log Bridge system**  
*Transforming Chrome extension debugging with AI-powered insights*
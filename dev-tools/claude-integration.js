/**
 * Claude Code Integration - Automated debugging assistance
 * Provides AI-powered analysis and suggestions for Chrome extension logs
 */

const fs = require('fs').promises;
const path = require('path');

class ClaudeCodeIntegration {
  constructor() {
    this.debuggingContext = new Map();
    this.analysisQueue = [];
    this.suggestionCache = new Map();
    this.setupPatternRecognition();
    this.loadKnowledgeBase();
  }

  async loadKnowledgeBase() {
    this.knowledgeBase = {
      patterns: {
        // Chrome extension specific errors
        'manifest_v3_issues': {
          patterns: [/service worker/i, /manifest v3/i, /background script/i],
          suggestions: [
            'Check if service worker is properly registered',
            'Verify manifest.json permissions',
            'Ensure proper message passing between contexts'
          ]
        },
        'content_script_issues': {
          patterns: [/content script/i, /dom/i, /injection/i],
          suggestions: [
            'Verify content script is injected properly',
            'Check for CSP (Content Security Policy) restrictions',
            'Ensure DOM is ready before accessing elements'
          ]
        },
        'api_errors': {
          patterns: [/api/i, /fetch/i, /openai/i, /request failed/i],
          suggestions: [
            'Check API key validity and permissions',
            'Verify network connectivity',
            'Check for rate limiting issues',
            'Validate request payload format'
          ]
        },
        'linkedin_specific': {
          patterns: [/linkedin/i, /job data/i, /extraction/i],
          suggestions: [
            'Check if LinkedIn page structure has changed',
            'Verify selectors are still valid',
            'Check for anti-bot measures',
            'Ensure proper timing for DOM elements'
          ]
        },
        'storage_issues': {
          patterns: [/storage/i, /chrome.storage/i, /sync/i],
          suggestions: [
            'Check storage permissions in manifest',
            'Verify storage quota limits',
            'Handle storage API errors gracefully'
          ]
        }
      },
      
      commonSolutions: {
        'permission_denied': [
          'Add required permissions to manifest.json',
          'Request permissions dynamically if needed',
          'Check host permissions for content scripts'
        ],
        'dom_not_ready': [
          'Use DOMContentLoaded event listener',
          'Implement element waiting utilities',
          'Add mutation observers for dynamic content'
        ],
        'async_timing': [
          'Implement proper async/await patterns',
          'Add error boundaries for promise rejections',
          'Use setTimeout for delayed operations'
        ]
      }
    };
  }

  setupPatternRecognition() {
    this.criticalPatterns = [
      {
        name: 'Extension Crash',
        pattern: /(?:uncaught|unhandled|critical|crash|fatal)/i,
        priority: 'critical',
        autoEscalate: true
      },
      {
        name: 'API Failure',
        pattern: /(?:api.*failed|request.*error|openai.*error)/i,
        priority: 'high',
        autoEscalate: true
      },
      {
        name: 'Data Loss',
        pattern: /(?:data.*lost|failed.*save|storage.*error)/i,
        priority: 'high',
        autoEscalate: true
      },
      {
        name: 'Performance Issue',
        pattern: /(?:slow|timeout|performance|memory)/i,
        priority: 'medium',
        autoEscalate: false
      }
    ];
  }

  async analyzeLogStream(logs) {
    const analysis = {
      timestamp: Date.now(),
      totalLogs: logs.length,
      errorCount: 0,
      patterns: {},
      suggestions: [],
      priority: 'low',
      context: {},
      needsAttention: false
    };

    // Analyze each log entry
    for (const log of logs) {
      await this.analyzeLogEntry(log, analysis);
    }

    // Generate comprehensive suggestions
    analysis.suggestions = await this.generateSuggestions(analysis);
    
    // Determine if Claude assistance is needed
    if (analysis.priority === 'critical' || analysis.errorCount > 5) {
      analysis.needsAttention = true;
      await this.escalateToClaudeCode(logs, analysis);
    }

    return analysis;
  }

  async analyzeLogEntry(log, analysis) {
    const message = log.message || '';
    
    // Count errors
    if (log.level === 'error') {
      analysis.errorCount++;
    }

    // Check critical patterns
    for (const pattern of this.criticalPatterns) {
      if (pattern.pattern.test(message)) {
        analysis.patterns[pattern.name] = (analysis.patterns[pattern.name] || 0) + 1;
        
        if (pattern.priority === 'critical') {
          analysis.priority = 'critical';
        } else if (pattern.priority === 'high' && analysis.priority !== 'critical') {
          analysis.priority = 'high';
        }
      }
    }

    // Extract context information
    if (log.context) {
      analysis.context[log.context] = (analysis.context[log.context] || 0) + 1;
    }

    // Analyze stack traces
    if (log.stackTrace || message.includes('at ')) {
      analysis.hasStackTrace = true;
      analysis.stackTraceCount = (analysis.stackTraceCount || 0) + 1;
    }
  }

  async generateSuggestions(analysis) {
    const suggestions = [];
    
    // Pattern-based suggestions
    for (const [patternName, patternData] of Object.entries(this.knowledgeBase.patterns)) {
      if (analysis.patterns[patternName]) {
        suggestions.push(...patternData.suggestions);
      }
    }

    // Context-based suggestions
    if (analysis.context['content-script'] && analysis.errorCount > 0) {
      suggestions.push('Check Content Security Policy restrictions');
      suggestions.push('Verify DOM element selectors are current');
    }

    if (analysis.context['background'] && analysis.errorCount > 0) {
      suggestions.push('Check service worker lifecycle events');
      suggestions.push('Verify message passing between contexts');
    }

    // Error count based suggestions
    if (analysis.errorCount > 10) {
      suggestions.push('Consider implementing error recovery mechanisms');
      suggestions.push('Add more detailed error logging');
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  async escalateToClaudeCode(logs, analysis) {
    console.log('\n🤖 CLAUDE CODE ASSISTANCE NEEDED 🤖');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const debuggingReport = await this.generateDebuggingReport(logs, analysis);
    
    // Write debugging report to file for Claude Code
    const reportPath = await this.writeDebuggingReport(debuggingReport);
    
    console.log(`📝 Debugging Report: ${reportPath}`);
    console.log('\n🎯 RECOMMENDED ACTIONS:');
    
    // Generate Claude Code command
    const claudeCommand = this.generateClaudeCommand(debuggingReport);
    console.log(`\n💡 Run this command to get Claude's help:`);
    console.log(`   ${claudeCommand}`);
    
    // Auto-generate workspace context
    await this.prepareClaudeWorkspace(debuggingReport);
  }

  async generateDebuggingReport(logs, analysis) {
    const recentErrors = logs.filter(log => log.level === 'error').slice(-10);
    const contextDistribution = analysis.context;
    
    const report = {
      summary: {
        timestamp: new Date().toISOString(),
        totalLogs: logs.length,
        errorCount: analysis.errorCount,
        priority: analysis.priority,
        contexts: Object.keys(contextDistribution),
        needsImmediateAttention: analysis.priority === 'critical'
      },
      
      errors: recentErrors.map(log => ({
        timestamp: new Date(log.timestamp).toISOString(),
        context: log.context,
        message: log.message,
        level: log.level,
        url: log.url,
        stackTrace: this.extractStackTrace(log)
      })),
      
      patterns: analysis.patterns,
      
      suggestions: analysis.suggestions,
      
      context: {
        distribution: contextDistribution,
        currentUrl: logs[logs.length - 1]?.url || 'unknown',
        sessionInfo: this.extractSessionInfo(logs)
      },
      
      aiAnalysis: await this.generateAIAnalysis(logs, analysis)
    };

    return report;
  }

  extractStackTrace(log) {
    const message = log.message || '';
    const lines = message.split('\n');
    return lines.filter(line => line.trim().startsWith('at ')).slice(0, 5);
  }

  extractSessionInfo(logs) {
    const contexts = new Set();
    const errorContexts = new Set();
    let sessionStart = null;
    
    logs.forEach(log => {
      if (log.context) contexts.add(log.context);
      if (log.level === 'error' && log.context) errorContexts.add(log.context);
      if (!sessionStart || log.timestamp < sessionStart) sessionStart = log.timestamp;
    });

    return {
      contexts: Array.from(contexts),
      errorContexts: Array.from(errorContexts),
      sessionDuration: Date.now() - sessionStart,
      sessionStart: new Date(sessionStart).toISOString()
    };
  }

  async generateAIAnalysis(logs, analysis) {
    // This would integrate with an AI service for deeper analysis
    // For now, provide rule-based analysis
    
    const issues = [];
    
    if (analysis.errorCount > analysis.totalLogs * 0.1) {
      issues.push({
        type: 'high_error_rate',
        severity: 'high',
        description: 'Error rate exceeds 10% of total logs',
        recommendation: 'Investigate root cause of frequent errors'
      });
    }

    if (analysis.context['content-script'] && analysis.context['background']) {
      issues.push({
        type: 'cross_context_issues',
        severity: 'medium',
        description: 'Errors occurring across multiple extension contexts',
        recommendation: 'Check message passing and shared state management'
      });
    }

    return {
      issues,
      confidence: issues.length > 0 ? 0.8 : 0.3,
      analysisType: 'rule_based'
    };
  }

  async writeDebuggingReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `debugging-report-${timestamp}.json`;
    const reportPath = path.join(process.cwd(), 'dev-tools', 'reports', filename);
    
    // Ensure reports directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Also write a human-readable version
    const readableReport = this.generateReadableReport(report);
    const readablePath = reportPath.replace('.json', '.md');
    await fs.writeFile(readablePath, readableReport);
    
    return reportPath;
  }

  generateReadableReport(report) {
    return `# LinkedIn Job Analyzer - Debugging Report

## Summary
- **Timestamp**: ${report.summary.timestamp}
- **Total Logs**: ${report.summary.totalLogs}
- **Error Count**: ${report.summary.errorCount}
- **Priority**: ${report.summary.priority}
- **Contexts**: ${report.summary.contexts.join(', ')}

## Recent Errors
${report.errors.map(error => `
### ${error.timestamp} - ${error.context}
- **Level**: ${error.level}
- **Message**: ${error.message}
- **URL**: ${error.url}
${error.stackTrace.length > 0 ? '- **Stack Trace**:\n  ' + error.stackTrace.join('\n  ') : ''}
`).join('\n')}

## Detected Patterns
${Object.entries(report.patterns).map(([pattern, count]) => `- **${pattern}**: ${count} occurrences`).join('\n')}

## AI Suggestions
${report.suggestions.map(suggestion => `- ${suggestion}`).join('\n')}

## AI Analysis
${report.aiAnalysis.issues.map(issue => `
### ${issue.type} (${issue.severity})
${issue.description}
**Recommendation**: ${issue.recommendation}
`).join('\n')}

---
*Report generated by Neural Log Bridge AI Analysis*
`;
  }

  generateClaudeCommand(report) {
    const reportFile = path.basename(report.summary.timestamp);
    return `claude read dev-tools/reports/${reportFile.replace(/[:.]/g, '-')}.md "Help me debug these Chrome extension issues"`;
  }

  async prepareClaudeWorkspace(report) {
    // Create a workspace context file for Claude
    const workspaceContext = {
      project: 'LinkedIn Job Analyzer Chrome Extension',
      issue: 'Debugging assistance needed',
      priority: report.summary.priority,
      contexts: report.summary.contexts,
      errorCount: report.summary.errorCount,
      
      files_to_examine: [
        'src/background.js',
        'src/content.js', 
        'src/popup.js',
        'manifest.json'
      ],
      
      suggested_actions: [
        'Analyze recent error patterns',
        'Check Chrome extension architecture',
        'Verify API integrations',
        'Review error handling mechanisms'
      ],
      
      debugging_focus: report.aiAnalysis.issues.map(issue => issue.type)
    };

    const contextPath = path.join(process.cwd(), 'dev-tools', 'claude-context.json');
    await fs.writeFile(contextPath, JSON.stringify(workspaceContext, null, 2));
    
    console.log(`📋 Claude workspace context prepared: ${contextPath}`);
  }
}

module.exports = ClaudeCodeIntegration;
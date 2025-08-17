/**
 * Simple Console Bridge - Stream LinkedIn Job Analyzer logs to terminal
 * Based on the EV Travel Visual Comparator console bridge
 */

(function() {
    'use strict';
    
    // Store original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    
    function sendToTerminal(level, args) {
        // Only send LinkedIn Job Analyzer logs
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        
        if (!message.includes('[LinkedIn Job Analyzer]')) {
            return; // Skip non-extension logs
        }
        
        const logData = {
            level,
            message,
            timestamp: Date.now(),
            url: window.location.href
        };
        
        // Send to terminal server
        fetch('http://localhost:8000/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData)
        }).catch(() => {}); // Fail silently if server not available
    }
    
    // Override console methods
    console.log = function(...args) {
        originalLog.apply(console, args);
        sendToTerminal('log', args);
    };
    
    console.error = function(...args) {
        originalError.apply(console, args);
        sendToTerminal('error', args);
    };
    
    console.warn = function(...args) {
        originalWarn.apply(console, args);
        sendToTerminal('warn', args);
    };
    
    console.info = function(...args) {
        originalInfo.apply(console, args);
        sendToTerminal('info', args);
    };
    
    // Send initial connection message
    console.log('[LinkedIn Job Analyzer] Console bridge connected - logs streaming to terminal');
})();
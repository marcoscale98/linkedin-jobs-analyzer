#!/bin/bash

# LinkedIn Job Analyzer - Bridge Injection Script
# Automatically injects the Quantum Bridge into extension contexts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BRIDGE_SCRIPT="$SCRIPT_DIR/quantum-bridge.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 LinkedIn Job Analyzer - Bridge Injection Tool${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if bridge script exists
if [ ! -f "$BRIDGE_SCRIPT" ]; then
    echo -e "${RED}❌ Error: quantum-bridge.js not found at $BRIDGE_SCRIPT${NC}"
    exit 1
fi

# Function to inject into a specific file
inject_into_file() {
    local file_path="$1"
    local context_type="$2"
    
    if [ ! -f "$file_path" ]; then
        echo -e "${YELLOW}⚠️  Warning: $file_path not found, skipping${NC}"
        return
    fi
    
    # Check if already injected
    if grep -q "linkedInJobAnalyzerQuantumBridge" "$file_path"; then
        echo -e "${YELLOW}📝 $context_type already has bridge injection${NC}"
        return
    fi
    
    echo -e "${GREEN}💉 Injecting bridge into $context_type ($file_path)${NC}"
    
    # Create backup
    cp "$file_path" "$file_path.backup.$(date +%s)"
    
    # Inject bridge script at the beginning
    {
        echo "// ===== QUANTUM BRIDGE INJECTION ====="
        echo "// Auto-injected by LinkedIn Job Analyzer dev tools"
        echo "// This enables real-time log streaming to Neural Bridge"
        cat "$BRIDGE_SCRIPT"
        echo ""
        echo "// ===== END QUANTUM BRIDGE INJECTION ====="
        echo ""
        cat "$file_path"
    } > "$file_path.tmp" && mv "$file_path.tmp" "$file_path"
    
    echo -e "${GREEN}✅ Bridge injected into $context_type${NC}"
}

# Function to remove injection from a file
remove_from_file() {
    local file_path="$1"
    local context_type="$2"
    
    if [ ! -f "$file_path" ]; then
        echo -e "${YELLOW}⚠️  Warning: $file_path not found, skipping${NC}"
        return
    fi
    
    if ! grep -q "linkedInJobAnalyzerQuantumBridge" "$file_path"; then
        echo -e "${YELLOW}📝 $context_type doesn't have bridge injection${NC}"
        return
    fi
    
    echo -e "${GREEN}🧹 Removing bridge from $context_type ($file_path)${NC}"
    
    # Create backup
    cp "$file_path" "$file_path.backup.$(date +%s)"
    
    # Remove injection (from start marker to end marker)
    sed '/===== QUANTUM BRIDGE INJECTION =====/,/===== END QUANTUM BRIDGE INJECTION =====/d' "$file_path" > "$file_path.tmp"
    mv "$file_path.tmp" "$file_path"
    
    echo -e "${GREEN}✅ Bridge removed from $context_type${NC}"
}

# Function to create manifest injection
inject_manifest() {
    local manifest_path="$PROJECT_ROOT/manifest.json"
    
    if [ ! -f "$manifest_path" ]; then
        echo -e "${RED}❌ Error: manifest.json not found at $manifest_path${NC}"
        return 1
    fi
    
    echo -e "${GREEN}📄 Updating manifest.json for bridge support${NC}"
    
    # Backup manifest
    cp "$manifest_path" "$manifest_path.backup.$(date +%s)"
    
    # Use Node.js to update manifest JSON
    node -e "
        const fs = require('fs');
        const manifest = JSON.parse(fs.readFileSync('$manifest_path', 'utf8'));
        
        // Add localhost permission for log bridge
        if (!manifest.permissions.includes('http://localhost/*')) {
            manifest.permissions.push('http://localhost/*');
        }
        
        // Add bridge script to content scripts if not already present
        if (manifest.content_scripts) {
            manifest.content_scripts.forEach(cs => {
                if (!cs.js.includes('dev-tools/quantum-bridge.js')) {
                    cs.js.unshift('dev-tools/quantum-bridge.js');
                }
            });
        }
        
        fs.writeFileSync('$manifest_path', JSON.stringify(manifest, null, 2));
        console.log('✅ Manifest updated successfully');
    "
}

# Function to remove manifest injection
remove_manifest() {
    local manifest_path="$PROJECT_ROOT/manifest.json"
    
    if [ ! -f "$manifest_path" ]; then
        echo -e "${RED}❌ Error: manifest.json not found at $manifest_path${NC}"
        return 1
    fi
    
    echo -e "${GREEN}📄 Cleaning manifest.json bridge references${NC}"
    
    # Backup manifest
    cp "$manifest_path" "$manifest_path.backup.$(date +%s)"
    
    # Use Node.js to clean manifest JSON
    node -e "
        const fs = require('fs');
        const manifest = JSON.parse(fs.readFileSync('$manifest_path', 'utf8'));
        
        // Remove localhost permission
        manifest.permissions = manifest.permissions.filter(p => p !== 'http://localhost/*');
        
        // Remove bridge script from content scripts
        if (manifest.content_scripts) {
            manifest.content_scripts.forEach(cs => {
                cs.js = cs.js.filter(script => !script.includes('quantum-bridge.js'));
            });
        }
        
        fs.writeFileSync('$manifest_path', JSON.stringify(manifest, null, 2));
        console.log('✅ Manifest cleaned successfully');
    "
}

# Main command handling
case "${1:-inject}" in
    "inject")
        echo -e "${GREEN}🎯 Injecting Quantum Bridge into extension files...${NC}"
        echo ""
        
        # Inject into main extension files
        inject_into_file "$PROJECT_ROOT/src/background.js" "Background Script"
        inject_into_file "$PROJECT_ROOT/src/content.js" "Content Script"
        inject_into_file "$PROJECT_ROOT/src/popup.js" "Popup Script"
        inject_into_file "$PROJECT_ROOT/src/options.js" "Options Script"
        
        # Update manifest
        inject_manifest
        
        echo ""
        echo -e "${GREEN}🎉 Bridge injection complete!${NC}"
        echo -e "${BLUE}📋 Next steps:${NC}"
        echo -e "   1. Start the log bridge: ${YELLOW}node dev-tools/start-log-bridge.js${NC}"
        echo -e "   2. Reload your Chrome extension"
        echo -e "   3. Extension logs will stream automatically"
        ;;
        
    "remove")
        echo -e "${GREEN}🧹 Removing Quantum Bridge from extension files...${NC}"
        echo ""
        
        # Remove from main extension files
        remove_from_file "$PROJECT_ROOT/src/background.js" "Background Script"
        remove_from_file "$PROJECT_ROOT/src/content.js" "Content Script"
        remove_from_file "$PROJECT_ROOT/src/popup.js" "Popup Script"
        remove_from_file "$PROJECT_ROOT/src/options.js" "Options Script"
        
        # Clean manifest
        remove_manifest
        
        echo ""
        echo -e "${GREEN}✅ Bridge removal complete!${NC}"
        ;;
        
    "status")
        echo -e "${GREEN}📊 Bridge Injection Status:${NC}"
        echo ""
        
        files_to_check=(
            "$PROJECT_ROOT/src/background.js:Background Script"
            "$PROJECT_ROOT/src/content.js:Content Script"
            "$PROJECT_ROOT/src/popup.js:Popup Script"
            "$PROJECT_ROOT/src/options.js:Options Script"
        )
        
        for file_info in "${files_to_check[@]}"; do
            IFS=':' read -r file_path context_type <<< "$file_info"
            
            if [ -f "$file_path" ]; then
                if grep -q "linkedInJobAnalyzerQuantumBridge" "$file_path"; then
                    echo -e "${GREEN}✅ $context_type: Bridge injected${NC}"
                else
                    echo -e "${YELLOW}❌ $context_type: No bridge${NC}"
                fi
            else
                echo -e "${RED}❓ $context_type: File not found${NC}"
            fi
        done
        ;;
        
    "help")
        echo -e "${GREEN}LinkedIn Job Analyzer - Bridge Injection Tool${NC}"
        echo ""
        echo -e "${BLUE}Usage:${NC}"
        echo -e "  $0 [command]"
        echo ""
        echo -e "${BLUE}Commands:${NC}"
        echo -e "  inject    Inject Quantum Bridge into extension files (default)"
        echo -e "  remove    Remove Quantum Bridge from extension files"
        echo -e "  status    Show injection status for all files"
        echo -e "  help      Show this help message"
        echo ""
        echo -e "${BLUE}Examples:${NC}"
        echo -e "  $0 inject          # Inject bridge into all extension files"
        echo -e "  $0 remove          # Remove bridge from all extension files"
        echo -e "  $0 status          # Check which files have bridge injected"
        ;;
        
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo -e "Use '$0 help' for usage information"
        exit 1
        ;;
esac
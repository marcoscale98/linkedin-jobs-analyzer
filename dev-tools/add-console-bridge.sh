#!/bin/bash

# Simple script to add/remove console bridge from extension files

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BRIDGE_SCRIPT="$SCRIPT_DIR/console-bridge.js"

case "${1:-add}" in
    "add")
        echo "📡 Adding console bridge to extension files..."
        
        # Add to manifest.json permissions
        if ! grep -q "localhost" "$PROJECT_ROOT/manifest.json"; then
            echo "  📄 Adding localhost permission to manifest.json"
            # Simple sed to add localhost permission
            sed -i.backup 's/"permissions": \[/"permissions": [\n    "http:\/\/localhost\/*",/' "$PROJECT_ROOT/manifest.json"
        fi
        
        # Add bridge script to extension files
        for file in src/background.js src/content.js src/popup.js; do
            if [ -f "$PROJECT_ROOT/$file" ] && ! grep -q "console-bridge" "$PROJECT_ROOT/$file"; then
                echo "  📝 Adding bridge to $file"
                cp "$PROJECT_ROOT/$file" "$PROJECT_ROOT/$file.backup"
                {
                    echo "// === Console Bridge for Development ==="
                    cat "$BRIDGE_SCRIPT"
                    echo ""
                    cat "$PROJECT_ROOT/$file"
                } > "$PROJECT_ROOT/$file.tmp" && mv "$PROJECT_ROOT/$file.tmp" "$PROJECT_ROOT/$file"
            fi
        done
        
        echo "✅ Console bridge added! Run 'npm run logs' to start the server"
        ;;
        
    "remove")
        echo "🧹 Removing console bridge from extension files..."
        
        # Restore backups
        for file in src/background.js src/content.js src/popup.js manifest.json; do
            if [ -f "$PROJECT_ROOT/$file.backup" ]; then
                echo "  📝 Restoring $file"
                mv "$PROJECT_ROOT/$file.backup" "$PROJECT_ROOT/$file"
            fi
        done
        
        echo "✅ Console bridge removed!"
        ;;
        
    *)
        echo "Usage: $0 [add|remove]"
        echo "  add    - Add console bridge to extension (default)"
        echo "  remove - Remove console bridge from extension"
        ;;
esac
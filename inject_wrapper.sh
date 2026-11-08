#!/usr/bin/env bash
# ==============================================================================
# Script: inject_wrapper.sh
# Purpose: Automatically refactor React Native screen files to use ScreenWrapper.
# Usage: ./inject_wrapper.sh [path_to_screens_directory]
# Example: ./inject_wrapper.sh ./screens
# ==============================================================================

set -euo pipefail

# Directory target (defaults to current directory or ./screens if present)
TARGET_DIR="${1:-./screens}"

if [ ! -d "$TARGET_DIR" ]; then
    if [ -d "./screens" ]; then
        TARGET_DIR="./screens"
    else
        TARGET_DIR="."
    fi
fi

echo "=================================================="
echo " Starting ScreenWrapper injection in: $TARGET_DIR"
echo "=================================================="

# Function to process an individual JavaScript/JSX screen file
refactor_screen() {
    local file="$1"
    
    # Skip if file doesn't exist or is ScreenWrapper itself
    if [[ ! -f "$file" ]] || [[ "$file" == *"ScreenWrapper"* ]]; then
        return
    fi

    # Check if the file contains SafeAreaView (the key indicator it needs wrapping)
    if ! grep -q "SafeAreaView" "$file"; then
        echo " [SKIP] $file (No SafeAreaView found)"
        return
    fi

    echo " [PROCESSING] $file ..."

    # 1. Create a temporary file for atomic write operations
    local tmp_file
    tmp_file=$(mktemp)

    # 2. Add import for ScreenWrapper if missing
    if ! grep -q "ScreenWrapper" "$file"; then
        # Determine relative path depth to components directory
        local rel_path="../components/ScreenWrapper"
        if [[ "$file" == *"src/screens/"* ]] || [[ "$file" == *"app/screens/"* ]]; then
            rel_path="../../components/ScreenWrapper"
        fi

        # Inject import right after the React import
        awk -v import_stmt="import ScreenWrapper from '$rel_path';" '
            /import React/ {
                print $0
                print import_stmt
                next
            }
            { print }
        ' "$file" > "$tmp_file"
        cp "$tmp_file" "$file"
    fi

    # 3. Replace <SafeAreaView ...> opening tag with <ScreenWrapper>
    # Handles both single line and multiline SafeAreaView tags
    sed -i -E 's/<SafeAreaView[^>]*>/<ScreenWrapper>/g' "$file"

    # 4. Replace </SafeAreaView> closing tag with </ScreenWrapper>
    sed -i 's/<\/SafeAreaView>/<\/ScreenWrapper>/g' "$file"

    # 5. Remove redundant <StatusBar ... /> declarations
    # Removes single-line StatusBar components
    sed -i -E '/<StatusBar[^>]*\/>/d' "$file"
    # Handles multi-line StatusBar removals
    awk '
        /<StatusBar/ { in_sb=1; next }
        in_sb && /\/>/ { in_sb=0; next }
        !in_sb { print }
    ' "$file" > "$tmp_file"
    cp "$tmp_file" "$file"

    # 6. Clean up unused SafeAreaView imports from react-native-safe-area-context
    sed -i -E 's/SafeAreaView,?[[:space:]]*//g' "$file"
    sed -i -E 's/,?[[:space:]]*SafeAreaView//g' "$file"
    # Remove empty import statement if nothing left in safe-area-context import
    sed -i -E "/import \{[[:space:]]*\} from ['\"]react-native-safe-area-context['\"];/d" "$file"

    # 7. Remove direct StatusBar imports from react-native
    sed -i -E 's/StatusBar,?[[:space:]]*//g' "$file"
    sed -i -E 's/,?[[:space:]]*StatusBar//g' "$file"

    # Cleanup temporary file
    rm -f "$tmp_file"
    echo " [FINISHED] Refactored: $file"
}

export -f refactor_screen

# Find and process all JS/JSX files in target directory
find "$TARGET_DIR" -maxdepth 2 -type f \( -name "*.js" -o -name "*.jsx" \) | while read -r filepath; do
    refactor_screen "$filepath"
done

echo "=================================================="
echo " Refactoring complete! All screen files updated."
echo "=================================================="
